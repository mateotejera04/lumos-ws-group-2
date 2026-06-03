/**
 * Agent 1 — Live Transcript Agent
 *
 * Owns the growing conversation history. In this prototype it is a small set of
 * pure helpers (the React state holds the array); in a larger system this is
 * where you'd handle diarization, partial/interim results, and de-duplication.
 */

import { Speaker, TranscriptTurn } from "../types";

let counter = 0;
export function newTurnId(): string {
  counter += 1;
  return `t${Date.now()}_${counter}`;
}

/** Append a finalized utterance to the history. */
export function appendTurn(
  turns: TranscriptTurn[],
  speaker: Speaker,
  text: string
): TranscriptTurn[] {
  const clean = text.trim();
  if (!clean) return turns;
  return [...turns, { id: newTurnId(), speaker, text: clean, ts: Date.now() }];
}

/** All text spoken by the patient (or unattributed speech), for extraction. */
export function patientText(turns: TranscriptTurn[]): string {
  return turns
    .filter((t) => t.speaker === "patient" || t.speaker === "unknown")
    .map((t) => t.text)
    .join(" ");
}

/** Full conversation as plain text. */
export function fullText(turns: TranscriptTurn[]): string {
  return turns.map((t) => t.text).join(" ");
}
