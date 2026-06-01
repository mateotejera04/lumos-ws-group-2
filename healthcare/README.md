# Healthcare Conversation Dataset

Sample conversations for the workshop challenge **"When Care Time Gets Lost in Complexity"**.

Each file contains a realistic (synthetic, fully anonymized) clinical conversation together with a
`ground_truth` block of labels. The conversations are the raw input; the ground-truth labels are the
target output a solution should be able to produce from the dialogue.

**Labelling rule:** every value in `ground_truth` is derivable from the input data only — i.e. from
the `turns` (the conversation) or the `patient_context` metadata. Nothing is "filled in" from outside
clinical knowledge. Where a clinician mentions something only vaguely (e.g. "some blood tests" with no
named panel, or a drug with no dose), the label says so (`"not specified"`) rather than inventing a
plausible value, and many entries cite the turn they come from.

## Files

| File | Scenario |
|------|----------|
| `01_general_consultation_chest_pain.json` | GP consultation - intermittent chest pain |
| `02_multilingual_language_barrier.json` | ED visit with limited language proficiency (interpreter present) |
| `03_nurse_triage_intake.json` | Nurse triage / intake interview |
| `04_medication_reconciliation_forgetful.json` | Medication reconciliation, elderly patient |
| `05_diabetes_followup.json` | Chronic disease follow-up - type 2 diabetes review |
| `06_discharge_instructions.json` | Discharge instructions after appendectomy |

## Schema

```jsonc
{
  "conversation_id": "string",
  "scenario": "string",
  "title": "string",
  "setting": "string",
  "languages": ["string"],
  "participants": [
    { "id": "string", "role": "doctor|nurse|patient|caregiver|interpreter", "name": "string" }
  ],
  "patient_context": { ... },          // background known before the visit
  "turns": [
    {
      "turn": 1,
      "speaker_id": "string",
      "role": "string",
      "language": "string",
      "text": "string",
      "translated_text": "string|null", // reference translation when language != clinician language
      "timestamp": "HH:MM:SS"
    }
  ],
  "ground_truth": {
    "chief_complaint": "string",
    "symptoms": [ { "name": "string", "onset": "string", ... } ],
    "relevant_history": ["string"],
    "vitals": { ... },
    "diagnosis": { "primary": "string", "differential": ["string"] },
    "ordered_tests": ["string"],
    "prescribed_medication": [ { "drug": "string", "dose": "string", "frequency": "string", "indication": "string" } ],
    "procedures": ["string"],
    "referrals": ["string"],
    "follow_up": ["string"],
    "patient_education": ["string"],
    "clinical_note": { ... }             // structured SOAP / summary documentation
  }
}
```

All names, dates and identifiers are fictional. No real patient data is included.
