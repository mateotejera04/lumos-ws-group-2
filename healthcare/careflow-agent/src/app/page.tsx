"use client";

import { useState } from "react";
import TranscriptInput from "@/components/TranscriptInput";
import ClinicalFactsPanel from "@/components/ClinicalFactsPanel";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import DocumentationPanel from "@/components/DocumentationPanel";
import AgentTimeline from "@/components/AgentTimeline";
import PatientChat from "@/components/PatientChat";
import { DEFAULT_SAMPLE, SAMPLE_CASES } from "@/lib/sampleData";
import { AgentWorkflowResult, ChatTurn } from "@/lib/types";

export default function Home() {
  const [transcript, setTranscript] = useState<string>(DEFAULT_SAMPLE.transcript);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(DEFAULT_SAMPLE.id);
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentWorkflowResult | null>(null);
  const [chat, setChat] = useState<ChatTurn[]>([]);

  function loadSample(id: string) {
    const sample = SAMPLE_CASES.find((c) => c.id === id);
    if (!sample) return;
    setTranscript(sample.transcript);
    setActiveSampleId(id);
    setResult(null);
    setChat([]);
    setError(null);
  }

  function clearAll() {
    setTranscript("");
    setActiveSampleId(null);
    setResult(null);
    setChat([]);
    setError(null);
  }

  async function run(text: string = transcript) {
    if (!text.trim()) {
      setError("Please paste a transcript or load a sample case.");
      return;
    }
    setLoading(true);
    setError(null);
    setChat([]); // a fresh analysis starts a fresh follow-up conversation
    try {
      const res = await fetch("/api/careflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, patientLanguage: language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setResult(data as AgentWorkflowResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Fold the simulated Q&A into the transcript and re-run the whole workflow.
  function appendAndReanalyze() {
    if (!chat.length) return;
    const block = chat
      .map((t) => (t.role === "clinician" ? "Doctor: " : "Patient: ") + t.text)
      .join("\n");
    const newTranscript = `${transcript.trim()}\n${block}`;
    setTranscript(newTranscript);
    setActiveSampleId(null);
    run(newTranscript);
  }

  const isEmergency = result?.risk.level === "emergency";
  const isHigh = result?.risk.level === "high";

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h3l2-5 3 11 3-9 1.5 3H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1>
              Care<em>Flow</em> Agent
            </h1>
            <p>agentic clinical workflow assistant · decision-support, not diagnosis</p>
          </div>
        </div>
        <div className="topbar-right">
          <svg className="ecg" viewBox="0 0 120 34" aria-hidden>
            <path d="M0 17 H26 l4 -11 5 24 5 -19 4 12 H64 l4 -8 4 16 4 -14 3 9 H120" />
          </svg>
          {result ? (
            <span className={`mode-pill${result.meta.mode === "llm" ? " live" : ""}`}>
              {result.meta.mode === "llm" ? "● LLM mode" : "● Mock mode"}
            </span>
          ) : null}
        </div>
      </header>

      <div className="disclaimer">
        <span className="ico" aria-hidden>
          ⚕
        </span>
        <span>
          CareFlow Agent supports clinicians — it extracts information, flags gaps and risk
          signals, and drafts documentation. It does <strong>not</strong> diagnose patients or
          replace clinical judgement. Every case requires clinician review.
        </span>
      </div>

      {(isEmergency || isHigh) && result ? (
        <div className={`alert-bar ${result.risk.level}`} role="alert">
          <span className="siren" aria-hidden>
            ⚠
          </span>
          <div className="body">
            <strong>
              {isEmergency
                ? "Emergency flag — escalate immediately"
                : "High risk — clinician review needed"}
            </strong>
            <span>{result.risk.recommendedAction}</span>
          </div>
          <span className="alert-score tnum">{result.risk.score}/100</span>
        </div>
      ) : null}

      {result ? <AgentTimeline steps={result.meta.steps} /> : null}

      {error ? (
        <div className="error-bar" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid">
        <TranscriptInput
          transcript={transcript}
          onChange={(v) => {
            setTranscript(v);
            setActiveSampleId(null);
          }}
          onRun={run}
          onLoadSample={loadSample}
          onClear={clearAll}
          activeSampleId={activeSampleId}
          loading={loading}
          language={language}
          onLanguageChange={setLanguage}
        />
        <ClinicalFactsPanel facts={result?.facts ?? null} />
        <RecommendationsPanel
          risk={result?.risk ?? null}
          missingInfo={result?.missingInfo ?? null}
        />
        <DocumentationPanel
          documentation={result?.documentation ?? null}
          patientSummary={result?.patientSummary ?? null}
        />
      </div>

      {result ? (
        <PatientChat
          transcript={transcript}
          facts={result.facts}
          missingInfo={result.missingInfo}
          turns={chat}
          setTurns={setChat}
          onAppendAndReanalyze={appendAndReanalyze}
          analyzing={loading}
        />
      ) : null}

      <p className="footer-note">
        careflow agent · extractor → missing-info → risk → documentation → patient-summary →
        follow-up sim · hackathon prototype
      </p>
    </main>
  );
}
