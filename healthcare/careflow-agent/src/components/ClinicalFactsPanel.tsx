"use client";

import { ClinicalFacts } from "@/lib/types";

function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <span className="empty">{empty}</span>;
  return (
    <div className="tags">
      {items.map((it, i) => (
        <span className="tag" key={i}>
          {it}
        </span>
      ))}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fact-group">
      <div className="fact-label readout">{label}</div>
      {children}
    </div>
  );
}

export default function ClinicalFactsPanel({ facts }: { facts: ClinicalFacts | null }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>
          <span className="step-badge">02</span> Extracted Clinical Facts
        </h2>
      </div>
      <div className="card-body">
        {!facts ? (
          <div className="placeholder">
            <div className="ph-icon" aria-hidden>
              ⊞
            </div>
            Run the workflow to see structured facts extracted from the conversation.
          </div>
        ) : (
          <>
            <Group label="Main complaint">
              <div className="fact-value">{facts.mainComplaint}</div>
            </Group>

            <Group label="Symptoms">
              {facts.symptoms.length ? (
                <div className="tags">
                  {facts.symptoms.map((s, i) => (
                    <span className="tag" key={i}>
                      {s.name}
                      {s.detail ? <span className="muted"> · {s.detail}</span> : null}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="empty">No symptoms detected</span>
              )}
            </Group>

            <Group label="Duration">
              <div className="fact-value">{facts.duration}</div>
            </Group>

            <Group label="Severity">
              <div className="fact-value">{facts.severity}</div>
            </Group>

            <Group label="Medications">
              {facts.medications.length ? (
                <div className="tags">
                  {facts.medications.map((m, i) => (
                    <span
                      className={`tag${/not specified|unknown/i.test(m.name) ? " unknown" : ""}`}
                      key={i}
                    >
                      {m.name}
                      {m.note ? <span className="muted"> · {m.note}</span> : null}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="empty">None reported</span>
              )}
            </Group>

            <Group label="Allergies">
              <TagList items={facts.allergies} empty="Not documented" />
            </Group>

            <Group label="Family history">
              <TagList items={facts.familyHistory} empty="None reported" />
            </Group>

            <Group label="Medical history">
              <TagList items={facts.medicalHistory} empty="None reported" />
            </Group>

            <Group label="Lifestyle factors">
              <TagList items={facts.lifestyleFactors} empty="None reported" />
            </Group>

            <Group label="Vitals">
              <div className="fact-value">
                {facts.vitals.status ?? Object.values(facts.vitals).join(", ")}
              </div>
            </Group>

            <Group label="Patient concerns">
              <TagList items={facts.patientConcerns} empty="None stated" />
            </Group>
          </>
        )}
      </div>
    </section>
  );
}
