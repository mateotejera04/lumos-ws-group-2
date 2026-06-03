/**
 * Agent 4 — Documentation
 *
 * Generates a clean, professional SOAP clinical note from the facts, the risk
 * assessment, and the missing-information report.
 *
 * Mock implementation composes the note deterministically. The LLM path can be
 * enabled for more natural prose; it falls back to the mock on any failure.
 */

import {
  ClinicalFacts,
  DocumentationOutput,
  MissingInformationResult,
  RiskAssessment,
} from "../types";
import { callLLMJson, isLlmAvailable } from "../llm";

function list(items: string[], empty = "None reported"): string {
  return items.length ? items.join("; ") : empty;
}

export function documentationAgentMock(
  facts: ClinicalFacts,
  risk: RiskAssessment,
  missingInfo: MissingInformationResult
): DocumentationOutput {
  const symptomLine = facts.symptoms
    .map((s) => (s.detail ? `${s.name} (${s.detail})` : s.name))
    .join(", ");

  const meds = facts.medications.length
    ? facts.medications.map((m) => (m.note ? `${m.name} — ${m.note}` : m.name)).join("; ")
    : "None reported";

  const subjective =
    `Patient presents with ${symptomLine || "symptoms described in the transcript"}.` +
    ` Duration: ${facts.duration}. Severity: ${facts.severity}.` +
    (facts.familyHistory.length ? ` Family history: ${list(facts.familyHistory)}.` : "") +
    (facts.patientConcerns.length ? ` Patient concerns: ${list(facts.patientConcerns)}.` : "");

  const objective =
    `Vitals: ${facts.vitals.status ?? list(Object.values(facts.vitals))}.` +
    ` Current medications: ${meds}. Allergies: ${list(facts.allergies, "Not documented")}.` +
    ` No physical examination findings recorded in the conversation.`;

  const assessment =
    `Triage support signal: ${risk.level.toUpperCase()} (urgency score ${risk.score}/100). ` +
    `${risk.reasons.join(" ")} ${risk.disclaimer}`;

  const missingLine = missingInfo.missingFields.length
    ? `Outstanding information to collect: ${missingInfo.missingFields
        .map((m) => m.field)
        .join(", ")}.`
    : "No critical information gaps identified.";

  const plan =
    `${risk.recommendedAction} ${missingLine} ` +
    `Suggested next question: "${missingInfo.nextBestQuestion}"`;

  return { soap: { subjective, objective, assessment, plan } };
}

const DOC_SYSTEM = `You are a clinical documentation agent. Write a concise, professional SOAP note from the provided structured data. Use neutral clinical language. Do NOT invent findings that are not in the data. Frame any assessment as decision-support, never a definitive diagnosis. Return STRICT JSON: {"subjective": string, "objective": string, "assessment": string, "plan": string}.`;

export async function documentationAgentLLM(
  facts: ClinicalFacts,
  risk: RiskAssessment,
  missingInfo: MissingInformationResult
): Promise<DocumentationOutput> {
  // LLM INSERTION POINT: produce more natural SOAP prose from the same data.
  const payload = JSON.stringify({ facts, risk, missingInfo }, null, 2);
  const soap = await callLLMJson<DocumentationOutput["soap"]>(
    DOC_SYSTEM,
    `Generate the SOAP note from this data:\n${payload}`
  );
  return {
    soap: {
      subjective: soap.subjective ?? "",
      objective: soap.objective ?? "",
      assessment: soap.assessment ?? "",
      plan: soap.plan ?? "",
    },
  };
}

export async function documentationAgent(
  facts: ClinicalFacts,
  risk: RiskAssessment,
  missingInfo: MissingInformationResult
): Promise<DocumentationOutput> {
  if (isLlmAvailable()) {
    try {
      return await documentationAgentLLM(facts, risk, missingInfo);
    } catch {
      /* fall back to mock */
    }
  }
  return documentationAgentMock(facts, risk, missingInfo);
}
