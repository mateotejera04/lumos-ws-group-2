/**
 * Agent 2 — Missing Information
 *
 * Compares the extracted facts against a clinical intake checklist and reports
 * what's missing, then proposes the single most valuable "next best question".
 *
 * DESIGN CHOICE: this agent is deterministic and rule-based on purpose. The
 * completeness checklist is a safety/quality control surface — clinicians need
 * it to be auditable and reproducible, not a black box. (An LLM insertion point
 * is provided for teams who want to soften the phrasing of questions.)
 */

import { ClinicalFacts, MissingField, MissingInformationResult } from "../types";

function hasSymptom(facts: ClinicalFacts, ...keys: string[]): boolean {
  return facts.symptoms.some((s) =>
    keys.some((k) => s.name.toLowerCase().includes(k))
  );
}

function symptomDetailIncludes(facts: ClinicalFacts, key: string): boolean {
  return facts.symptoms.some((s) => (s.detail ?? "").toLowerCase().includes(key));
}

export function missingInfoAgent(facts: ClinicalFacts): MissingInformationResult {
  const missing: MissingField[] = [];
  const chestPain = hasSymptom(facts, "chest");

  // --- Symptom characterisation (applies to any pain complaint) ---------
  const intensityKnown = /\d\s*\/\s*10|\b\d{1,2}\s*out of\s*10/i.test(facts.severity);
  if ((chestPain || hasSymptom(facts, "headache", "pain")) && !intensityKnown) {
    missing.push({
      field: "Pain intensity (1–10)",
      why: "No numeric severity was recorded.",
      priority: chestPain ? "high" : "medium",
    });
  }

  if (chestPain) {
    if (!symptomDetailIncludes(facts, "central") && !symptomDetailIncludes(facts, "left")) {
      missing.push({
        field: "Exact location of chest pain",
        why: "Location helps distinguish cardiac from non-cardiac causes.",
        priority: "high",
      });
    }
    if (!symptomDetailIncludes(facts, "radiat") && !symptomDetailIncludes(facts, "arm")) {
      missing.push({
        field: "Radiation (arm / jaw / back)",
        why: "Radiation is a key cardiac red-flag feature.",
        priority: "high",
      });
    }
  }

  // --- Vitals -----------------------------------------------------------
  const vitalsMeasured =
    Object.keys(facts.vitals).some((k) => k !== "status") &&
    !/(not measured|not specified)/i.test(JSON.stringify(facts.vitals));
  if (!vitalsMeasured) {
    missing.push({
      field: "Current vitals (BP, HR, SpO₂, temp)",
      why: "No vitals were captured during the conversation.",
      priority: chestPain ? "high" : "medium",
    });
  }

  // --- Medication details ----------------------------------------------
  const unnamedMed = facts.medications.some((m) => /not specified|unknown/i.test(m.name));
  if (unnamedMed) {
    missing.push({
      field: "Medication name & dose",
      why: "Patient takes a medication but could not recall the name.",
      priority: "medium",
    });
  }

  // --- Allergies --------------------------------------------------------
  if (facts.allergies.length === 0) {
    missing.push({
      field: "Allergy status",
      why: "Allergies were not discussed.",
      priority: "medium",
    });
  }

  // --- Next best question (priority-ordered) ----------------------------
  let nextBestQuestion =
    "Is there any other detail about your symptoms you think the doctor should know?";
  if (chestPain) {
    nextBestQuestion =
      "Can you rate the chest pressure from 1 to 10, and does it spread to your arm, jaw, or back?";
  } else if (hasSymptom(facts, "headache")) {
    nextBestQuestion =
      "Have you had any vision changes, weakness, or the worst headache of your life?";
  } else if (unnamedMed) {
    nextBestQuestion =
      "Could you bring the packaging or a photo of the blood pressure medication you take?";
  }

  // LLM INSERTION POINT: pass `missing` to an LLM to phrase a warmer, more
  // context-aware next-best-question. Keep the deterministic checklist above
  // as the source of truth for *what* is missing.

  return { missingFields: missing, nextBestQuestion };
}
