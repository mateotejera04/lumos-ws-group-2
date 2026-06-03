"use client";

import { MissingInformationResult, RiskAssessment, RiskLevel } from "@/lib/types";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "var(--ok)",
  medium: "var(--warn)",
  high: "var(--alert)",
  emergency: "var(--alert-bright)",
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  emergency: "Emergency",
};

/** Circular vitals-monitor gauge that sweeps to the urgency score. */
function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(score, 0), 100) / 100);
  const color = LEVEL_COLOR[level];
  return (
    <div className="gauge" role="img" aria-label={`Urgency score ${score} of 100`}>
      <svg width="116" height="116" viewBox="0 0 116 116">
        <circle className="gauge-track" cx="58" cy="58" r={r} />
        <circle
          className="gauge-fill"
          cx="58"
          cy="58"
          r={r}
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <div>
          <div className="gauge-score" style={{ color }}>
            {score}
          </div>
          <div className="gauge-max">/ 100</div>
        </div>
      </div>
    </div>
  );
}

const RISK_ICON: Record<RiskLevel, string> = {
  low: "✓",
  medium: "▲",
  high: "⚠",
  emergency: "⚠",
};

export default function RecommendationsPanel({
  risk,
  missingInfo,
}: {
  risk: RiskAssessment | null;
  missingInfo: MissingInformationResult | null;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>
          <span className="step-badge">03</span> Agent Recommendations
        </h2>
      </div>
      <div className="card-body">
        {!risk || !missingInfo ? (
          <div className="placeholder">
            <div className="ph-icon" aria-hidden>
              ⌁
            </div>
            Risk level, information gaps, and the next best question appear here.
          </div>
        ) : (
          <>
            <div className="gauge-wrap">
              <RiskGauge score={risk.score} level={risk.level} />
              <div className="gauge-meta">
                <span className={`risk-chip ${risk.level}`}>
                  <span aria-hidden>{RISK_ICON[risk.level]}</span>
                  {LEVEL_LABEL[risk.level]}
                </span>
                <div className="risk-sub">triage signal · not a diagnosis</div>
              </div>
            </div>

            <div className="section-label readout">Why this classification</div>
            <ul className="reason-list">
              {risk.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <div className="section-label readout">Missing information</div>
            {missingInfo.missingFields.length ? (
              <div>
                {missingInfo.missingFields.map((m, i) => (
                  <div className="missing-item" key={i}>
                    <span className={`prio-dot ${m.priority}`} aria-hidden />
                    <div>
                      <div className="missing-field">{m.field}</div>
                      <div className="missing-why">{m.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="empty">No critical gaps identified.</span>
            )}

            <div className="section-label readout">Next best question</div>
            <div className="callout question">
              <strong className="readout">Suggested to clinician</strong>
              {missingInfo.nextBestQuestion}
            </div>

            <div className="section-label readout">Recommended action</div>
            <div className="callout action">
              <strong className="readout">Workflow recommendation</strong>
              {risk.recommendedAction}
            </div>

            <p
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                marginTop: 16,
                marginBottom: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              {risk.disclaimer}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
