/**
 * Sample consultations for the demo. The first one is the canonical
 * "chest pressure" case the jury will see — it exercises every agent and
 * triggers a HIGH risk classification.
 */

export interface SampleCase {
  id: string;
  label: string;
  description: string;
  transcript: string;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "chest-pressure",
    label: "Chest pressure (high risk)",
    description:
      "Intermittent chest pressure + shortness of breath, family history, unnamed BP medication.",
    transcript: `Doctor: Hello, what brings you in today?
Patient: I have had pressure in my chest since yesterday. It comes and goes.
Doctor: Do you have any other symptoms?
Patient: Sometimes I feel short of breath when walking.
Doctor: Any family history of heart disease?
Patient: Yes, my father had heart problems.
Doctor: Are you taking any medications?
Patient: I don't remember the name, but I take something for blood pressure.`,
  },
  {
    id: "headache",
    label: "Headache (medium risk)",
    description:
      "Recurrent headaches over two weeks with some light sensitivity; lower acuity.",
    transcript: `Doctor: Good morning, how can I help you today?
Patient: I keep getting headaches. It's been about two weeks now.
Doctor: Where is the pain, and how bad is it?
Patient: Mostly on the right side. Maybe a 5 out of 10. Bright light makes it worse.
Doctor: Any nausea, vision changes, or weakness?
Patient: A little nauseous sometimes, but no vision changes.
Doctor: Do you take any medication or have allergies?
Patient: Just ibuprofen when it's bad. No allergies that I know of.`,
  },
  {
    id: "sore-throat",
    label: "Sore throat (low risk)",
    description: "Three-day sore throat, mild, no red-flag features.",
    transcript: `Doctor: Hi there, what's going on today?
Patient: I've had a sore throat for about three days.
Doctor: Any fever, difficulty swallowing, or breathing problems?
Patient: No fever. Swallowing is a bit uncomfortable but fine. Breathing is normal.
Doctor: Any medications or allergies?
Patient: I took some throat lozenges. I'm allergic to penicillin.`,
  },
];

export const DEFAULT_SAMPLE = SAMPLE_CASES[0];
