/**
 * Agent 2 — Clinical Extractor Agent
 *
 * Extracts structured clinical facts from the transcript so far. Deterministic,
 * keyword-driven, and safe: it records only what was said and never infers a
 * diagnosis. Designed to run on every transcript change (real time).
 *
 * LLM INSERTION POINT: replace the body with a call to an LLM that returns the
 * same ClinicalFacts shape. Keep this deterministic version as the offline/
 * fallback path so the live demo never depends on a network call.
 */

import { ClinicalFacts, Medication, Symptom, TranscriptTurn } from "../types";
import { patientText } from "./liveTranscriptAgent";

function has(t: string, ...needles: string[]): boolean {
  return needles.some((n) => t.includes(n));
}

export function clinicalExtractorAgent(turns: TranscriptTurn[]): ClinicalFacts {
  const text = patientText(turns).toLowerCase();

  // Negation-aware presence check.
  const present = (term: string, ...denials: string[]): boolean => {
    if (!text.includes(term)) return false;
    return ![`no ${term}`, `without ${term}`, `denies ${term}`, `not ${term}`, ...denials].some(
      (d) => text.includes(d)
    );
  };

  // --- Symptoms ---------------------------------------------------------
  const symptoms: Symptom[] = [];
  if (has(text, "chest pressure", "pressure in my chest", "chest pain", "chest tightness")) {
    const detail: string[] = [];
    if (has(text, "comes and goes", "intermittent", "on and off")) detail.push("intermittent");
    if (has(text, "radiat", "spread", "arm", "jaw", "shoulder")) {
      const sites: string[] = [];
      if (has(text, "arm")) sites.push("arm");
      if (has(text, "jaw")) sites.push("jaw");
      if (has(text, "shoulder")) sites.push("shoulder");
      if (has(text, "radiat", "spread") && has(text, "back")) sites.push("back");
      if (sites.length) detail.push(`radiates to ${sites.join("/")}`);
    }
    symptoms.push({ name: "Chest pressure", detail: detail.join("; ") || undefined });
  }
  if (has(text, "short of breath", "shortness of breath", "breathless", "out of breath")) {
    symptoms.push({
      name: "Shortness of breath",
      detail: has(text, "walk", "exert", "stairs") ? "on exertion" : undefined,
    });
  }
  if (has(text, "headache", "head ache"))
    symptoms.push({ name: "Headache", detail: has(text, "light") ? "photophobia" : undefined });
  if (has(text, "sore throat")) symptoms.push({ name: "Sore throat" });
  if (has(text, "nausea", "nauseous", "queasy")) symptoms.push({ name: "Nausea" });
  if (has(text, "dizzy", "lightheaded", "light-headed")) symptoms.push({ name: "Dizziness" });
  if (has(text, "sweaty", "sweating", "clammy")) symptoms.push({ name: "Sweating" });
  if (present("fever")) symptoms.push({ name: "Fever (reported)" });

  // --- Duration ---------------------------------------------------------
  let duration = "Not stated";
  const dm = text.match(
    /(since\s+\w+|for\s+(about\s+)?\w+\s+(day|days|week|weeks|month|months|hour|hours)|\b\w+\s+(day|days|week|weeks)\s+ago)/
  );
  if (dm) duration = dm[0].trim();
  else if (text.includes("yesterday")) duration = "since yesterday";

  // --- Severity ---------------------------------------------------------
  let severity = "Not rated";
  const sv = text.match(/(\d{1,2})\s*(out of|\/)\s*10/);
  if (sv) severity = `${sv[1]}/10 (patient-rated)`;
  else if (has(text, "comes and goes", "intermittent")) severity = "Intermittent; intensity not rated";

  // --- Family history ---------------------------------------------------
  const familyHistory: string[] = [];
  if (has(text, "father") && has(text, "heart")) familyHistory.push("Father — heart problems");
  else if (has(text, "mother") && has(text, "heart")) familyHistory.push("Mother — heart problems");
  else if (has(text, "family") && has(text, "heart")) familyHistory.push("Family history of heart disease");

  // --- Medical history --------------------------------------------------
  const medicalHistory: string[] = [];
  if (has(text, "diabetes")) medicalHistory.push("Diabetes (reported)");
  if (has(text, "high blood pressure", "hypertension")) medicalHistory.push("Hypertension (reported)");

  // --- Medications ------------------------------------------------------
  const medications: Medication[] = [];
  const amlo = text.match(/amlodipine[^.,;]*/);
  if (amlo) medications.push({ name: amlo[0].trim() });
  else if (has(text, "blood pressure") && has(text, "medication", "tablet", "pill", "take something", "something for"))
    medications.push({ name: "Unknown", note: "blood-pressure medication, name not recalled" });
  if (has(text, "ibuprofen")) medications.push({ name: "Ibuprofen", note: "as needed" });

  // --- Allergies --------------------------------------------------------
  const allergies: string[] = [];
  if (has(text, "penicillin")) allergies.push("Penicillin");
  if (has(text, "no allergies", "no known allergies")) allergies.push("None reported");

  // --- Vitals -----------------------------------------------------------
  const vitals =
    has(text, "blood pressure was", "bp was", "pressure was") || /\d{2,3}\s*\/\s*\d{2,3}/.test(text)
      ? "Some vitals mentioned — confirm in chart"
      : "Not measured in conversation";

  // --- Concerns ---------------------------------------------------------
  const patientConcerns: string[] = [];
  if (has(text, "worried", "scared", "afraid", "anxious", "nervous"))
    patientConcerns.push("Patient expressed worry");

  return {
    mainComplaint: symptoms[0]?.name ?? (symptoms.length ? symptoms[0].name : "Not yet stated"),
    symptoms,
    duration,
    severity,
    medicalHistory,
    familyHistory,
    medications,
    allergies,
    vitals,
    patientConcerns,
  };
}
