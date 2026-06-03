/**
 * Patient Simulation Agent
 *
 * Role-plays the PATIENT in a follow-up consultation so a clinician can
 * practise asking the questions CareFlow suggested. It answers in first person,
 * consistent with the original case, and (importantly) reveals the details that
 * were previously missing when asked — so re-analysing the extended transcript
 * visibly fills the gaps and updates the risk picture.
 *
 * This is a TRAINING SIMULATION, not a real patient and not medical advice.
 *
 * LLM path stays in character via a strict system prompt; the mock path uses
 * deterministic, case-grounded rules so the demo works with no API key.
 */

import { ChatTurn, ClinicalFacts } from "../types";
import { callLLM, isLlmAvailable } from "../llm";

interface PatientInput {
  transcript: string;
  facts: ClinicalFacts;
  history: ChatTurn[];
  message: string;
}

function hasSymptom(facts: ClinicalFacts, ...keys: string[]): boolean {
  return facts.symptoms.some((s) => keys.some((k) => s.name.toLowerCase().includes(k)));
}

/** Deterministic, case-grounded patient responder. */
export function patientReplyMock(input: PatientInput): string {
  const q = input.message.toLowerCase();
  const f = input.facts;
  const chest = hasSymptom(f, "chest");
  const headache = hasSymptom(f, "headache");
  const sore = hasSymptom(f, "sore throat");

  const match = (...needles: string[]) => needles.some((n) => q.includes(n));

  // Severity / rating
  if (match("1 to 10", "1-10", "out of 10", "rate", "scale", "how bad", "how severe")) {
    if (chest) return "When it comes on, I'd say it's about a 7 out of 10. It eases off when I rest.";
    if (headache) return "Maybe a 5 out of 10 most days, a bit worse with bright light.";
    return "It's moderate — maybe a 5 or 6 out of 10.";
  }

  // Radiation
  if (match("radiate", "spread", "your arm", "jaw", "back", "move anywhere", "travel")) {
    if (chest)
      return "Now that you ask — yes, sometimes it goes down my left arm. Not really my jaw or back though.";
    return "No, it pretty much stays in one place.";
  }

  // Location
  if (match("where", "location", "point to", "which part")) {
    if (chest) return "Right here in the middle of my chest, behind the breastbone.";
    if (headache) return "Mostly on the right side of my head.";
    if (sore) return "In my throat, it's worse when I swallow.";
    return "It's hard to say exactly, doctor.";
  }

  // Medication name / dose
  if (match("name of", "which medication", "what medication", "what tablet", "what pill", "what's it called", "called", "dose", "milligram"))
    return "I checked the box at home — I think it's amlodipine, 5 milligrams, once a day.";

  // Vitals / blood pressure reading
  if (match("blood pressure reading", "measure", "check your pressure", "vitals", "your numbers", "last reading"))
    return "I haven't checked it today. Last time at the pharmacy it was a little high, I remember that.";

  // Allergies
  if (match("allerg", "reaction to"))
    return f.allergies.some((a) => /penicillin/i.test(a))
      ? "Yes — I'm allergic to penicillin."
      : "No allergies that I'm aware of.";

  // Breathing
  if (match("short of breath", "breath", "breathing", "winded"))
    return "Yes, I get a bit short of breath — mostly when I walk or go up the stairs.";

  // Associated symptoms
  if (match("sweat", "clammy")) return "Yes, I do feel a bit sweaty when it's bad.";
  if (match("nausea", "sick", "vomit", "queasy")) return "A little queasy sometimes, but I haven't actually been sick.";
  if (match("dizzy", "faint", "lightheaded", "pass out")) return "Once or twice I felt a bit lightheaded, yes.";
  if (match("palpitation", "heart racing", "flutter")) return "Sometimes my heart feels like it's pounding when it happens.";
  if (match("fever", "temperature")) return "No, no fever.";
  if (match("vision", "blurred", "see")) return "No, my vision's been fine.";

  // Triggers / relief / timing
  if (match("trigger", "bring it on", "worse when", "what makes it worse", "activity", "exert"))
    return chest
      ? "It usually comes on when I climb the stairs or rush around. Resting makes it stop."
      : "I'm not sure what brings it on, really.";
  if (match("better", "relieve", "help", "ease", "settle"))
    return "Sitting down and resting for a few minutes usually makes it settle.";
  if (match("when did", "how long", "since when", "start"))
    return `It started ${/(yesterday|week|day)/i.test(f.duration) ? f.duration.toLowerCase() : "a little while ago"}, like I mentioned.`;

  // History
  if (match("family", "father", "mother", "parents", "relatives"))
    return "My father had heart problems — he had a heart attack in his sixties.";
  if (match("smoke", "cigarette", "tobacco")) return "I smoke about five cigarettes a day, I know I should cut down.";
  if (match("alcohol", "drink")) return "Just a beer or two on the weekend.";
  if (match("diabetes", "sugar", "cholesterol")) return "Not that I've been told, no.";
  if (match("surgery", "operation", "hospital before")) return "No, I've never had any surgery.";

  // Reassurance / meta
  if (match("how are you", "how do you feel", "feeling today"))
    return "About the same, doctor — it still comes and goes.";
  if (match("worried", "scared", "anxious", "concern"))
    return "Honestly, yes, I'm a bit worried — that's why my wife told me to come in.";

  // Fallback — stays in character, no new claims.
  return "Hmm, I'm not sure about that, doctor. I don't think so.";
}

const PATIENT_SYSTEM = `You are role-playing as the PATIENT in a clinical consultation. This is a TRAINING SIMULATION to help a clinician practise their questioning — you are not a real person and must never give medical advice or act as the clinician.

Rules:
- Always answer in the first person, as the patient, in plain everyday language.
- Stay strictly consistent with the case facts and prior conversation provided. Never contradict them.
- Keep replies short and natural (1-3 sentences), the way a real patient would speak — some hesitation and uncertainty is fine.
- When the clinician asks about something not yet established (e.g. pain radiation, intensity, medication name), give a plausible, mild, internally-consistent answer that helps the consultation progress. Do not invent dramatic new conditions unprompted.
- Never break character. Never output clinical analysis, diagnoses, or recommendations.`;

export async function patientReplyLLM(input: PatientInput): Promise<string> {
  // LLM INSERTION POINT: the model plays the patient, grounded in the case.
  const context = `ORIGINAL CONSULTATION TRANSCRIPT:\n${input.transcript}\n\nSTRUCTURED CASE FACTS (for your consistency):\n${JSON.stringify(
    input.facts
  )}`;

  const messages = [
    { role: "system" as const, content: `${PATIENT_SYSTEM}\n\n${context}` },
    ...input.history.map((t) => ({
      role: (t.role === "clinician" ? "user" : "assistant") as "user" | "assistant",
      content: t.text,
    })),
    { role: "user" as const, content: input.message },
  ];

  const reply = await callLLM(messages, { temperature: 0.6 });
  return reply.trim();
}

export async function patientReply(input: PatientInput): Promise<string> {
  if (isLlmAvailable()) {
    try {
      return await patientReplyLLM(input);
    } catch {
      /* fall back to deterministic patient */
    }
  }
  return patientReplyMock(input);
}
