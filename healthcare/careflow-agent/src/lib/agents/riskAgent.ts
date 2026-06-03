/**
 * Agent 3 — Risk & Urgency
 *
 * Evaluates the case for risk signals and classifies urgency as
 * low / medium / high / emergency, with explicit reasons.
 *
 * THIS IS NOT A DIAGNOSIS. It produces a triage support signal and always
 * recommends clinician review. Like the Missing Information agent, the scoring
 * is deterministic and auditable by design — safety logic should be inspectable.
 */

import {
  ClinicalFacts,
  MissingInformationResult,
  RiskAssessment,
  RiskLevel,
} from "../types";

const DISCLAIMER =
  "Decision-support only — not a diagnosis. All cases require clinician review.";

function hasSymptom(facts: ClinicalFacts, ...keys: string[]): boolean {
  return facts.symptoms.some((s) =>
    keys.some((k) => s.name.toLowerCase().includes(k))
  );
}

export function riskAgent(
  facts: ClinicalFacts,
  missingInfo: MissingInformationResult
): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  const chestPain = hasSymptom(facts, "chest");
  const sob = hasSymptom(facts, "shortness of breath", "breath");
  const headache = hasSymptom(facts, "headache");
  const familyCardiac = facts.familyHistory.some((h) => /heart/i.test(h));
  const radiation = facts.symptoms.some((s) => /arm|jaw|back|radiat/i.test(s.detail ?? ""));
  const photophobia = facts.symptoms.some((s) => /light/i.test(s.detail ?? ""));
  const highPriorityMissing = missingInfo.missingFields.filter((m) => m.priority === "high").length;
  const mediumPriorityMissing = missingInfo.missingFields.filter((m) => m.priority === "medium").length;

  // --- Cardiac red-flag signals ----------------------------------------
  if (chestPain) {
    score += 40;
    reasons.push("Chest pain/pressure reported — potential cardiac red flag.");
  }
  if (sob) {
    score += 18;
    reasons.push("Shortness of breath reported, especially on exertion.");
  }
  if (radiation) {
    score += 25;
    reasons.push("Pain radiates to arm/jaw/back — classic cardiac warning feature.");
  }
  if (familyCardiac) {
    score += 10;
    reasons.push("Family history of heart disease increases cardiac risk.");
  }

  // --- Other symptom signals -------------------------------------------
  if (headache) {
    score += 14;
    reasons.push("Recurrent/ongoing headache reported.");
  }
  if (photophobia) {
    score += 6;
    reasons.push("Light sensitivity (photophobia) noted.");
  }
  if (hasSymptom(facts, "nausea")) {
    score += 6;
    reasons.push("Associated nausea reported.");
  }
  if (hasSymptom(facts, "sore throat")) {
    score += 6;
    reasons.push("Sore throat reported.");
  }
  if (hasSymptom(facts, "fever") && sob) {
    score += 10;
    reasons.push("Fever with breathing difficulty.");
  }

  // --- Information-completeness signals (capped — never dominate) -------
  if (highPriorityMissing > 0) {
    score += Math.min(highPriorityMissing * 3, 9);
    reasons.push(
      `${highPriorityMissing} high-priority detail(s) missing (e.g. vitals, radiation) — cannot fully rule out a serious cause.`
    );
  }
  if (mediumPriorityMissing > 0) {
    score += Math.min(mediumPriorityMissing * 2, 8);
  }
  if (facts.patientConcerns.length > 0) {
    score += 3;
    reasons.push("Patient expressed concern/anxiety.");
  }

  if (reasons.length === 0) {
    reasons.push("No major red-flag features detected in the conversation.");
  }

  // --- Classification ---------------------------------------------------
  // Emergency is reserved for an active red flag (chest pain WITH radiation)
  // or a near-maximal symptom-driven score — NOT for missing-information
  // pile-up alone. Bands: low <25, medium 25–59, high 60–89, emergency 90+.
  let level: RiskLevel;
  if ((chestPain && radiation) || score >= 90) level = "emergency";
  else if (score >= 60) level = "high";
  else if (score >= 25) level = "medium";
  else level = "low";

  const recommendedAction = recommend(level, chestPain);

  return {
    level,
    score: Math.min(score, 100),
    reasons,
    recommendedAction,
    disclaimer: DISCLAIMER,
  };
}

function recommend(level: RiskLevel, chestPain: boolean): string {
  switch (level) {
    case "emergency":
      return "Emergency: escalate immediately for urgent clinician assessment; consider ECG and emergency pathway now.";
    case "high":
      return chestPain
        ? "Escalate for clinician review and consider checking vitals and ECG."
        : "Escalate for prompt clinician review and capture vitals before the patient leaves.";
    case "medium":
      return "Flag for clinician review during this visit; gather the missing information.";
    case "low":
      return "Routine clinician review; document and proceed with standard care.";
  }
}
