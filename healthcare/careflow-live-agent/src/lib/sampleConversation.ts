/**
 * Sample consultation used by the "Load Sample Live Consultation" demo. Turns
 * are revealed progressively so it feels like a real, live conversation and the
 * suggestions update as the dialogue unfolds.
 */

import { Speaker } from "./types";

export interface SampleLine {
  speaker: Exclude<Speaker, "unknown">;
  text: string;
}

export const SAMPLE_CONVERSATION: SampleLine[] = [
  { speaker: "doctor", text: "Hello, what brings you in today?" },
  {
    speaker: "patient",
    text: "I have had pressure in my chest since yesterday. It comes and goes.",
  },
  { speaker: "doctor", text: "Do you have any other symptoms?" },
  { speaker: "patient", text: "Sometimes I feel short of breath when walking." },
  { speaker: "doctor", text: "Do you have any family history of heart disease?" },
  { speaker: "patient", text: "Yes, my father had heart problems." },
  { speaker: "doctor", text: "Are you taking any medications?" },
  {
    speaker: "patient",
    text: "I take something for blood pressure, but I do not remember the name.",
  },
];

/** Milliseconds between each revealed turn in the live demo. */
export const SAMPLE_TURN_DELAY_MS = 1700;
