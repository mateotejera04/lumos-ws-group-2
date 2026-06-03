"use client";

import { AgentStep } from "@/lib/types";

export default function AgentTimeline({ steps }: { steps: AgentStep[] }) {
  if (!steps.length) return null;
  return (
    <div className="timeline" aria-label="Agent workflow timeline">
      {steps.map((s, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            className="tl-step"
            title={s.summary}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="tl-num">{i + 1}</span>
            {s.agent}
          </span>
          {i < steps.length - 1 ? (
            <span className="tl-arrow" aria-hidden>
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
