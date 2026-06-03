"use client";

import { useState } from "react";
import { DocumentationOutput, PatientSummary } from "@/lib/types";

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

const SOAP_ROWS: { key: keyof DocumentationOutput["soap"]; letter: string; title: string }[] = [
  { key: "subjective", letter: "S", title: "Subjective" },
  { key: "objective", letter: "O", title: "Objective" },
  { key: "assessment", letter: "A", title: "Assessment" },
  { key: "plan", letter: "P", title: "Plan" },
];

export default function DocumentationPanel({
  documentation,
  patientSummary,
}: {
  documentation: DocumentationOutput | null;
  patientSummary: PatientSummary | null;
}) {
  const soapText = documentation
    ? SOAP_ROWS.map((r) => `${r.title}:\n${documentation.soap[r.key]}`).join("\n\n")
    : "";

  return (
    <section className="card">
      <div className="card-head">
        <h2>
          <span className="step-badge">04</span> Generated Documentation
        </h2>
        {documentation ? <CopyButton getText={() => soapText} label="Copy SOAP" /> : null}
      </div>
      <div className="card-body">
        {!documentation || !patientSummary ? (
          <div className="placeholder">
            <div className="ph-icon" aria-hidden>
              ✎
            </div>
            The SOAP note and patient-friendly summary appear here after a run.
          </div>
        ) : (
          <>
            {SOAP_ROWS.map((r, i) => (
              <div className="soap-block" key={r.key} style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="soap-letter" aria-hidden>
                  {r.letter}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="soap-title readout">{r.title}</div>
                  <div className="soap-text">{documentation.soap[r.key]}</div>
                </div>
              </div>
            ))}

            <div className="section-label readout" style={{ marginTop: 18 }}>
              Patient-friendly summary · {patientSummary.language.toUpperCase()}
            </div>
            <div className="summary-box">{patientSummary.text}</div>

            <div className="copy-row">
              <CopyButton getText={() => patientSummary.text} label="Copy summary" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
