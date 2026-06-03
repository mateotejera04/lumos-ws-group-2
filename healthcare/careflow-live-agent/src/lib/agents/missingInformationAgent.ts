/**
 * Agent 3 — Missing Information Agent
 *
 * Compares extracted facts against a clinical intake checklist and reports the
 * gaps with priority. Deterministic and auditable on purpose — a clinician must
 * be able to trust *why* something is flagged as missing.
 */

import { ClinicalFacts, MissingField, MissingInformation } from "../types";

function hasSymptom(f: ClinicalFacts, ...keys: string[]): boolean {
  return f.symptoms.some((s) => keys.some((k) => s.name.toLowerCase().includes(k)));
}
function detailIncludes(f: ClinicalFacts, key: string): boolean {
  return f.symptoms.some((s) => (s.detail ?? "").toLowerCase().includes(key));
}

export function missingInformationAgent(f: ClinicalFacts): MissingInformation {
  const fields: MissingField[] = [];
  const chest = hasSymptom(f, "chest");
  const anyPain = chest || hasSymptom(f, "headache", "pain");

  const intensityKnown = /\d\s*\/\s*10/.test(f.severity);
  if (anyPain && !intensityKnown)
    fields.push({
      field: "pain_intensity",
      label: "Pain intensity (1–10)",
      priority: chest ? "high" : "medium",
    });

  if (chest && !detailIncludes(f, "radiat") && !detailIncludes(f, "arm"))
    fields.push({
      field: "radiation",
      label: "Radiation (arm / jaw / back / shoulder)",
      priority: "high",
    });

  if (anyPain && !detailIncludes(f, "central") && !detailIncludes(f, "left") && !chestLocationKnown(f))
    fields.push({ field: "location", label: "Exact location", priority: chest ? "medium" : "low" });

  if (f.duration === "Not stated")
    fields.push({ field: "duration", label: "Symptom duration / onset", priority: "medium" });

  if (/not measured/i.test(f.vitals))
    fields.push({
      field: "vitals",
      label: "Current vitals (BP, HR, SpO₂, temp)",
      priority: chest ? "high" : "medium",
    });

  if (f.medications.some((m) => /unknown/i.test(m.name)))
    fields.push({ field: "medication_name", label: "Medication name & dose", priority: "medium" });

  if (f.allergies.length === 0)
    fields.push({ field: "allergies", label: "Allergy status", priority: "medium" });

  return { fields };
}

function chestLocationKnown(f: ClinicalFacts): boolean {
  return f.symptoms.some((s) => /middle|centre|center|breastbone/i.test(s.detail ?? ""));
}
