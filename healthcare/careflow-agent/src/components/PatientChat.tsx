"use client";

import { useEffect, useRef, useState } from "react";
import { ChatTurn, ClinicalFacts, MissingInformationResult } from "@/lib/types";

interface Props {
  transcript: string;
  facts: ClinicalFacts;
  missingInfo: MissingInformationResult;
  turns: ChatTurn[];
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  onAppendAndReanalyze: () => void;
  analyzing: boolean;
}

/** Turn a missing-field label into a natural question the clinician might ask. */
function fieldToQuestion(field: string): string {
  const f = field.toLowerCase();
  if (f.includes("intensity")) return "On a scale of 1 to 10, how bad is it?";
  if (f.includes("location")) return "Can you point to exactly where it hurts?";
  if (f.includes("radiation")) return "Does the pain spread to your arm, jaw, or back?";
  if (f.includes("vitals")) return "Have you checked your blood pressure recently?";
  if (f.includes("medication")) return "Do you know the name and dose of that medication?";
  if (f.includes("allergy")) return "Do you have any allergies?";
  return `Can you tell me more about your ${field.toLowerCase()}?`;
}

export default function PatientChat({
  transcript,
  facts,
  missingInfo,
  turns,
  setTurns,
  onAppendAndReanalyze,
  analyzing,
}: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = turns;
    setTurns((prev) => [...prev, { role: "clinician", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/patient-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, facts, history, message }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : `(${data?.error ?? "error"})`;
      setTurns((prev) => [...prev, { role: "patient", text: reply }]);
    } catch {
      setTurns((prev) => [...prev, { role: "patient", text: "(connection error)" }]);
    } finally {
      setBusy(false);
    }
  }

  // Build suggestion chips: the starred next-best-question + top missing fields.
  const suggestions = [
    { text: missingInfo.nextBestQuestion, star: true },
    ...missingInfo.missingFields
      .filter((m) => m.priority === "high")
      .slice(0, 3)
      .map((m) => ({ text: fieldToQuestion(m.field), star: false })),
  ].filter(
    (s, i, arr) => arr.findIndex((x) => x.text === s.text) === i // dedupe
  );

  return (
    <section className="card chat-card">
      <div className="card-head">
        <h2>
          <span className="step-badge">05</span> Follow-up Consultation
        </h2>
        <span className="sim-note">◐ simulated patient · practice mode</span>
      </div>
      <div className="card-body">
        <div className="chat-window">
          {turns.length === 0 ? (
            <div className="chat-empty">
              Ask the suggested questions below — the AI patient answers in character so you can
              practise the consultation, then fold the answers back into the record.
            </div>
          ) : (
            turns.map((t, i) => (
              <div className={`bubble ${t.role}`} key={i}>
                <span className="who">{t.role === "clinician" ? "Doctor" : "Patient"}</span>
                {t.text}
              </div>
            ))
          )}
          {busy ? (
            <div className="bubble typing">
              <span className="typing-dots" aria-label="Patient is typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="chat-suggest">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className={`suggest-chip${s.star ? " star" : ""}`}
              onClick={() => send(s.text)}
              disabled={busy}
              title="Ask this question"
            >
              {s.star ? "★ " : "+ "}
              {s.text}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Ask the patient a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
          />
          <button className="btn btn-primary" onClick={() => send(input)} disabled={busy || !input.trim()}>
            Send
          </button>
        </div>

        <div className="chat-actions">
          <button
            className="btn"
            onClick={onAppendAndReanalyze}
            disabled={analyzing || turns.length === 0}
          >
            ↻ Add answers to record & re-analyze
          </button>
          <span className="reanalyze-hint">
            folds this Q&amp;A into the transcript and re-runs all agents
          </span>
        </div>
      </div>
    </section>
  );
}
