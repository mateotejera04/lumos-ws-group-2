/**
 * POST /api/patient-chat
 *
 * Returns the simulated patient's reply to a clinician question, grounded in the
 * original transcript + extracted facts. Runs server-side so any LLM key stays
 * off the client; falls back to the deterministic patient with no key.
 *
 * Request:  { transcript: string, facts: ClinicalFacts, history: ChatTurn[], message: string }
 * Response: { reply: string }
 */

import { NextResponse } from "next/server";
import { patientReply } from "@/lib/agents/patientAgent";
import { ChatTurn, ClinicalFacts } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const transcript = typeof body?.transcript === "string" ? body.transcript : "";
    const facts = body?.facts as ClinicalFacts | undefined;
    const history = Array.isArray(body?.history) ? (body.history as ChatTurn[]) : [];

    if (!message) {
      return NextResponse.json({ error: "A 'message' is required." }, { status: 400 });
    }
    if (!facts) {
      return NextResponse.json(
        { error: "Run the analysis first so the patient has context." },
        { status: 400 }
      );
    }

    const reply = await patientReply({ transcript, facts, history, message });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("patient-chat failed:", err);
    return NextResponse.json({ error: "Patient simulation failed." }, { status: 500 });
  }
}
