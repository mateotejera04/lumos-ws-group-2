/**
 * Orchestrator — coordinates the CareFlow multi-agent workflow.
 *
 * Fixed pipeline (each step's output feeds the next):
 *   1. Clinical Extractor      → structured facts
 *   2. Missing Information      → gaps + next best question
 *   3. Risk & Urgency          → triage signal
 *   4. Documentation           → SOAP note
 *   5. Patient Communication   → plain-language summary
 *
 * The orchestrator also records a step-by-step timeline (surfaced in the UI)
 * and reports whether the run used the LLM or the deterministic mock.
 */

import { AgentStep, AgentWorkflowResult, ConsultationInput } from "../types";
import { clinicalExtractor } from "./clinicalExtractor";
import { missingInfoAgent } from "./missingInfoAgent";
import { riskAgent } from "./riskAgent";
import { documentationAgent } from "./documentationAgent";
import { patientCommunicationAgent } from "./patientCommunicationAgent";
import { isLlmAvailable } from "../llm";

export async function runCareFlowAgent(
  input: ConsultationInput
): Promise<AgentWorkflowResult> {
  const transcript = input.transcript.trim();
  const steps: AgentStep[] = [];
  const mode = isLlmAvailable() ? "llm" : "mock";

  // 1 — Extract clinical facts.
  const facts = await clinicalExtractor(transcript);
  steps.push({
    agent: "Clinical Extractor",
    status: "done",
    summary: `Captured ${facts.symptoms.length} symptom(s), ${facts.medications.length} medication(s).`,
  });

  // 2 — Detect missing information & next best question.
  const missingInfo = missingInfoAgent(facts);
  steps.push({
    agent: "Missing Information",
    status: "done",
    summary: `${missingInfo.missingFields.length} information gap(s) identified.`,
  });

  // 3 — Assess risk & urgency.
  const risk = riskAgent(facts, missingInfo);
  steps.push({
    agent: "Risk & Urgency",
    status: "done",
    summary: `Classified as ${risk.level.toUpperCase()} (score ${risk.score}/100).`,
  });

  // 4 — Generate SOAP documentation.
  const documentation = await documentationAgent(facts, risk, missingInfo);
  steps.push({
    agent: "Documentation",
    status: "done",
    summary: "SOAP note generated.",
  });

  // 5 — Generate patient-friendly summary.
  const patientSummary = await patientCommunicationAgent(
    facts,
    risk,
    input.patientLanguage ?? "en"
  );
  steps.push({
    agent: "Patient Communication",
    status: "done",
    summary: `Plain-language summary generated (${patientSummary.language}).`,
  });

  steps.push({
    agent: "Orchestrator",
    status: "done",
    summary: "Workflow complete.",
  });

  return {
    facts,
    missingInfo,
    risk,
    documentation,
    patientSummary,
    meta: {
      mode,
      steps,
      generatedAt: new Date().toISOString(),
    },
  };
}
