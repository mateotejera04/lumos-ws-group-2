/**
 * POST /api/careflow
 *
 * Runs the orchestrated multi-agent workflow server-side. Keeping this on the
 * server means any LLM API key never reaches the browser. With no key
 * configured, the orchestrator runs in deterministic mock mode.
 *
 * Request body:  { transcript: string, patientLanguage?: string }
 * Response body: AgentWorkflowResult
 */

import { NextResponse } from "next/server";
import { runCareFlowAgent } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const transcript = typeof body?.transcript === "string" ? body.transcript : "";

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'transcript' is required." },
        { status: 400 }
      );
    }

    const result = await runCareFlowAgent({
      transcript,
      patientLanguage: typeof body?.patientLanguage === "string" ? body.patientLanguage : "en",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("CareFlow run failed:", err);
    return NextResponse.json(
      { error: "CareFlow workflow failed. Check server logs." },
      { status: 500 }
    );
  }
}
