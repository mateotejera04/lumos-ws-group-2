/**
 * Shared types for CareFlow Live Agent.
 * The orchestrator turns a list of TranscriptTurns into a CareFlowAgentResult
 * on every transcript change, in real time.
 */

export type Speaker = "doctor" | "patient" | "unknown";

/** One utterance in the live conversation. */
export interface TranscriptTurn {
  id: string;
  speaker: Speaker;
  text: string;
  ts: number; // epoch ms
}

export interface Symptom {
  name: string;
  detail?: string;
}

export interface Medication {
  name: string;
  note?: string;
}

/** Structured clinical facts extracted from the conversation so far. */
export interface ClinicalFacts {
  mainComplaint: string;
  symptoms: Symptom[];
  duration: string;
  severity: string;
  medicalHistory: string[];
  familyHistory: string[];
  medications: Medication[];
  allergies: string[];
  vitals: string;
  patientConcerns: string[];
}

export type Priority = "high" | "medium" | "low";

export interface MissingField {
  field: string; // machine key, e.g. "pain_intensity"
  label: string; // human label, e.g. "Pain intensity (1–10)"
  priority: Priority;
}

export interface MissingInformation {
  fields: MissingField[];
}

/** A ranked question the doctor should consider asking next. */
export interface SuggestedQuestion {
  rank: number;
  text: string;
  rationale: string;
  priority: Priority;
}

export type RiskLevel = "low" | "medium" | "high" | "emergency";

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0–100
  reasons: string[];
  recommendedAction: string;
  disclaimer: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/** Everything the dashboard needs for one real-time pass. */
export interface CareFlowAgentResult {
  facts: ClinicalFacts;
  missing: MissingInformation;
  questions: SuggestedQuestion[];
  risk: RiskAssessment;
  soap: SOAPNote;
  utterances: number;
}
