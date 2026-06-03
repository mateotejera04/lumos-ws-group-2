/**
 * Shared types for the CareFlow Agent workflow.
 *
 * These types form the contract between the agents. Each agent consumes and/or
 * produces one of these structures, and the orchestrator stitches them into a
 * single `AgentWorkflowResult` that the dashboard renders.
 */

/** Raw input to the workflow: a doctor–patient consultation transcript. */
export interface ConsultationInput {
  transcript: string;
  /** Optional preferred language for the patient-facing summary (ISO code). */
  patientLanguage?: string;
}

/** A single reported symptom plus any qualifying detail found in the transcript. */
export interface Symptom {
  name: string;
  detail?: string;
}

/** A medication mentioned by the patient. `name` may be unknown ("not specified"). */
export interface Medication {
  name: string;
  note?: string;
}

/**
 * Structured clinical facts extracted from the conversation.
 * Every field is derived ONLY from what was said — unknowns are explicit.
 */
export interface ClinicalFacts {
  mainComplaint: string;
  symptoms: Symptom[];
  duration: string;
  severity: string;
  medicalHistory: string[];
  familyHistory: string[];
  medications: Medication[];
  allergies: string[];
  lifestyleFactors: string[];
  /** Vitals if mentioned; otherwise a status note (e.g. "not measured"). */
  vitals: Record<string, string>;
  patientConcerns: string[];
}

export type Priority = "high" | "medium" | "low";

/** One piece of clinically relevant information that was NOT captured. */
export interface MissingField {
  field: string;
  why: string;
  priority: Priority;
}

/** Output of the Missing Information Agent. */
export interface MissingInformationResult {
  missingFields: MissingField[];
  /** The single most valuable question the clinician should ask next. */
  nextBestQuestion: string;
}

export type RiskLevel = "low" | "medium" | "high" | "emergency";

/**
 * Output of the Risk & Urgency Agent.
 * NOTE: This is a triage support signal, NOT a diagnosis.
 */
export interface RiskAssessment {
  level: RiskLevel;
  /** 0–100 internal urgency score backing the level. */
  score: number;
  reasons: string[];
  recommendedAction: string;
  /** Always present — reinforces that this does not replace a clinician. */
  disclaimer: string;
}

/** Structured SOAP clinical note. */
export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/** Output of the Documentation Agent. */
export interface DocumentationOutput {
  soap: SoapNote;
}

/** Output of the Patient Communication Agent. */
export interface PatientSummary {
  language: string;
  text: string;
}

export type AgentName =
  | "Clinical Extractor"
  | "Missing Information"
  | "Risk & Urgency"
  | "Documentation"
  | "Patient Communication"
  | "Orchestrator";

/** A single step in the orchestrated run, surfaced as a workflow timeline. */
export interface AgentStep {
  agent: AgentName;
  status: "done";
  summary: string;
}

export type RunMode = "mock" | "llm";

/** One turn in the simulated follow-up consultation. */
export interface ChatTurn {
  role: "clinician" | "patient";
  text: string;
}

/** The full result of one CareFlow run — everything the dashboard needs. */
export interface AgentWorkflowResult {
  facts: ClinicalFacts;
  missingInfo: MissingInformationResult;
  risk: RiskAssessment;
  documentation: DocumentationOutput;
  patientSummary: PatientSummary;
  meta: {
    mode: RunMode;
    steps: AgentStep[];
    generatedAt: string;
  };
}
