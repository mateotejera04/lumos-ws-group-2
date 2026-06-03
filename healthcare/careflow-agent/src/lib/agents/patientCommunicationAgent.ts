/**
 * Agent 5 — Patient Communication
 *
 * Produces a short, plain-language summary for the patient. It deliberately
 * avoids medical overconfidence: no diagnosis, no alarming language, and a
 * clear pointer that a clinician is reviewing the case.
 *
 * Mock implementation is deterministic; the LLM path can translate/soften it.
 */

import {
  ClinicalFacts,
  PatientSummary,
  RiskAssessment,
} from "../types";
import { callLLM, isLlmAvailable } from "../llm";

export function patientCommunicationAgentMock(
  facts: ClinicalFacts,
  risk: RiskAssessment
): PatientSummary {
  const symptoms = facts.symptoms.map((s) => s.name.toLowerCase()).join(" and ");

  const opening = symptoms
    ? `Thanks for sharing how you're feeling. You told us about ${symptoms}.`
    : `Thanks for sharing how you're feeling today.`;

  let nextStep: string;
  switch (risk.level) {
    case "emergency":
      nextStep =
        "Because of your symptoms, we want a doctor to see you right away. Please do not leave — our team is being notified now.";
      break;
    case "high":
      nextStep =
        "To be safe, we'd like a doctor to review your symptoms soon and check a few things like your blood pressure and heart tracing (ECG).";
      break;
    case "medium":
      nextStep =
        "A doctor will go over your symptoms with you during this visit and may ask a few more questions.";
      break;
    default:
      nextStep =
        "Your symptoms look manageable, and a doctor will confirm the next steps with you.";
  }

  const reassurance =
    "This summary is to help you follow along — it is not a diagnosis. Your care team makes all final decisions.";

  return {
    language: "en",
    text: `${opening} ${nextStep} ${reassurance}`,
  };
}

const PATIENT_SYSTEM = `You write short, warm, plain-language summaries for patients at roughly a 6th-grade reading level. Avoid medical jargon and never state a diagnosis or give false reassurance. Make clear the care team makes final decisions. Keep it to 3-4 sentences.`;

export async function patientCommunicationAgentLLM(
  facts: ClinicalFacts,
  risk: RiskAssessment,
  language: string
): Promise<PatientSummary> {
  // LLM INSERTION POINT: translate + soften tone. `language` lets you request
  // the summary in the patient's preferred language.
  const text = await callLLM(
    [
      { role: "system", content: PATIENT_SYSTEM },
      {
        role: "user",
        content: `Write the patient summary in language code "${language}". Symptoms: ${facts.symptoms
          .map((s) => s.name)
          .join(", ")}. Urgency level: ${risk.level}. Recommended next step: ${risk.recommendedAction}`,
      },
    ],
    { temperature: 0.4 }
  );
  return { language, text: text.trim() };
}

export async function patientCommunicationAgent(
  facts: ClinicalFacts,
  risk: RiskAssessment,
  language = "en"
): Promise<PatientSummary> {
  if (isLlmAvailable()) {
    try {
      return await patientCommunicationAgentLLM(facts, risk, language);
    } catch {
      /* fall back to mock */
    }
  }
  return patientCommunicationAgentMock(facts, risk);
}
