/**
 * Agent 1 — Clinical Extractor
 *
 * Reads the consultation transcript and extracts structured clinical facts.
 * It does NOT interpret or diagnose — it only captures what was stated.
 *
 * Two implementations live here:
 *   - extractClinicalFactsMock(): deterministic, keyword-driven, always works.
 *   - extractClinicalFactsLLM():  prompts an OpenAI-compatible model.
 * The exported `clinicalExtractor()` prefers the LLM when configured and
 * silently falls back to the mock on any failure.
 */

import { ClinicalFacts, Medication, Symptom } from "../types";
import { callLLMJson, isLlmAvailable } from "../llm";

/** Pull just the patient's words out of a "Doctor: / Patient:" transcript. */
function patientText(transcript: string): string {
  return transcript
    .split(/\r?\n/)
    .filter((l) => /^\s*patient\s*:/i.test(l))
    .map((l) => l.replace(/^\s*patient\s*:/i, "").trim())
    .join(" ");
}

function has(text: string, ...needles: string[]): boolean {
  const t = text.toLowerCase();
  return needles.some((n) => t.includes(n));
}

/** Deterministic extractor — covers the demo cases and degrades gracefully. */
export function extractClinicalFactsMock(transcript: string): ClinicalFacts {
  const patient = patientText(transcript);
  const t = patient.toLowerCase();

  // Negation helper: true when a term is present and NOT explicitly denied.
  const present = (term: string, ...denials: string[]): boolean => {
    if (!t.includes(term)) return false;
    const allDenials = [`no ${term}`, `without ${term}`, `denies ${term}`, `not ${term}`, ...denials];
    return !allDenials.some((d) => t.includes(d));
  };

  // --- Symptoms ---------------------------------------------------------
  const symptoms: Symptom[] = [];
  if (has(t, "chest pressure", "pressure in my chest", "chest pain", "chest tightness")) {
    const details: string[] = [];
    if (has(t, "comes and goes", "intermittent", "on and off")) {
      details.push("intermittent (comes and goes)");
    }
    // Radiation is a key cardiac red flag — capture which sites are mentioned.
    if (has(t, "radiat", "spread", "arm", "jaw")) {
      const sites: string[] = [];
      if (has(t, "arm")) sites.push("arm");
      if (has(t, "jaw")) sites.push("jaw");
      if (has(t, "radiat", "spread") && has(t, "back")) sites.push("back");
      if (sites.length) details.push(`radiates to ${sites.join("/")}`);
    }
    symptoms.push({ name: "Chest pressure", detail: details.join("; ") || undefined });
  }
  if (has(t, "short of breath", "shortness of breath", "breathless", "out of breath")) {
    symptoms.push({
      name: "Shortness of breath",
      detail: has(t, "walking", "exert", "stairs") ? "on exertion (when walking)" : undefined,
    });
  }
  if (has(t, "headache", "head ache")) {
    symptoms.push({
      name: "Headache",
      detail: has(t, "light") ? "worse with bright light (photophobia)" : undefined,
    });
  }
  if (has(t, "sore throat")) symptoms.push({ name: "Sore throat" });
  if (has(t, "nausea", "nauseous")) symptoms.push({ name: "Nausea" });
  if (present("fever")) symptoms.push({ name: "Fever (reported)" });

  // --- Duration ---------------------------------------------------------
  let duration = "Not specified";
  const durMatch = patient.match(
    /(since\s+\w+|for\s+(about\s+)?\w+\s+(day|days|week|weeks|month|months|hour|hours)|\b\w+\s+(day|days|week|weeks)\s+(ago|now))/i
  );
  if (durMatch) duration = durMatch[0].trim();
  else if (has(t, "yesterday")) duration = "Since yesterday";

  // --- Severity ---------------------------------------------------------
  let severity = "Not specified (intensity not rated)";
  const sev = patient.match(/(\d{1,2})\s*(out of|\/)\s*10/i);
  if (sev) severity = `${sev[1]}/10 (patient-rated)`;
  else if (has(t, "comes and goes", "intermittent")) severity = "Intermittent; intensity not rated";

  // --- Family history ---------------------------------------------------
  const familyHistory: string[] = [];
  if (has(t, "father") && has(t, "heart")) familyHistory.push("Father — heart problems (patient-reported)");
  else if (has(t, "mother") && has(t, "heart")) familyHistory.push("Mother — heart problems (patient-reported)");
  else if (has(t, "family") && has(t, "heart")) familyHistory.push("Family history of heart disease (patient-reported)");

  // --- Medications ------------------------------------------------------
  const medications: Medication[] = [];
  if (has(t, "blood pressure")) {
    medications.push({
      name: "Not specified",
      note: "Patient takes a medication for blood pressure but does not recall the name",
    });
  }
  if (has(t, "ibuprofen")) medications.push({ name: "Ibuprofen", note: "as needed for pain" });
  if (has(t, "lozenge")) medications.push({ name: "Throat lozenges", note: "over the counter" });

  // --- Allergies --------------------------------------------------------
  const allergies: string[] = [];
  if (has(t, "penicillin")) allergies.push("Penicillin");
  if (has(t, "no allergies", "no known allergies")) allergies.push("None reported");

  // --- Lifestyle --------------------------------------------------------
  const lifestyleFactors: string[] = [];
  if (has(t, "smoke", "smoking")) lifestyleFactors.push("Smoking (mentioned)");
  if (has(t, "alcohol", "drink")) lifestyleFactors.push("Alcohol use (mentioned)");

  // --- Patient concerns -------------------------------------------------
  const patientConcerns: string[] = [];
  if (has(t, "worried", "scared", "afraid", "anxious")) patientConcerns.push("Patient expressed worry/anxiety");

  return {
    mainComplaint: symptoms[0]?.name ?? "See transcript",
    symptoms,
    duration,
    severity,
    medicalHistory: [],
    familyHistory,
    medications,
    allergies,
    lifestyleFactors,
    vitals: { status: "Not measured during the conversation" },
    patientConcerns,
  };
}

const EXTRACTOR_SYSTEM = `You are a clinical information extraction agent. Read a doctor-patient consultation transcript and extract ONLY facts that were explicitly stated. Never infer, diagnose, or add outside clinical knowledge. When something is vague or absent, use "Not specified". Return STRICT JSON matching this shape:
{
  "mainComplaint": string,
  "symptoms": [{"name": string, "detail": string|null}],
  "duration": string,
  "severity": string,
  "medicalHistory": string[],
  "familyHistory": string[],
  "medications": [{"name": string, "note": string|null}],
  "allergies": string[],
  "lifestyleFactors": string[],
  "vitals": {"status": string},
  "patientConcerns": string[]
}`;

/** LLM-backed extractor. */
export async function extractClinicalFactsLLM(transcript: string): Promise<ClinicalFacts> {
  // LLM INSERTION POINT: a more capable model produces richer extraction here.
  const raw = await callLLMJson<ClinicalFacts>(
    EXTRACTOR_SYSTEM,
    `Consultation transcript:\n"""\n${transcript}\n"""\nExtract the structured clinical facts as JSON.`
  );
  // Normalise to guarantee the shape the UI expects.
  return {
    mainComplaint: raw.mainComplaint ?? "See transcript",
    symptoms: raw.symptoms ?? [],
    duration: raw.duration ?? "Not specified",
    severity: raw.severity ?? "Not specified",
    medicalHistory: raw.medicalHistory ?? [],
    familyHistory: raw.familyHistory ?? [],
    medications: raw.medications ?? [],
    allergies: raw.allergies ?? [],
    lifestyleFactors: raw.lifestyleFactors ?? [],
    vitals: raw.vitals ?? { status: "Not measured during the conversation" },
    patientConcerns: raw.patientConcerns ?? [],
  };
}

/** Public entry point used by the orchestrator. */
export async function clinicalExtractor(transcript: string): Promise<ClinicalFacts> {
  if (isLlmAvailable()) {
    try {
      return await extractClinicalFactsLLM(transcript);
    } catch {
      // Fall through to deterministic mock — the demo must never break.
    }
  }
  return extractClinicalFactsMock(transcript);
}
