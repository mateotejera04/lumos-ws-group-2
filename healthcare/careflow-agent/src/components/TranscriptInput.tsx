"use client";

import { SAMPLE_CASES } from "@/lib/sampleData";

interface Props {
  transcript: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onLoadSample: (id: string) => void;
  onClear: () => void;
  activeSampleId: string | null;
  loading: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export default function TranscriptInput({
  transcript,
  onChange,
  onRun,
  onLoadSample,
  onClear,
  activeSampleId,
  loading,
  language,
  onLanguageChange,
}: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>
          <span className="step-badge">01</span> Consultation Transcript
        </h2>
      </div>
      <div className="card-body">
        <textarea
          className="transcript"
          placeholder={"Doctor: ...\nPatient: ..."}
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="sample-row">
          <div className="sample-label readout">Load a sample case</div>
          <div className="sample-chips">
            {SAMPLE_CASES.map((c) => (
              <button
                key={c.id}
                className={`chip${activeSampleId === c.id ? " active" : ""}`}
                onClick={() => onLoadSample(c.id)}
                title={c.description}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => onRun()} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Running agents…
              </>
            ) : (
              <>▶ Run CareFlow Agent</>
            )}
          </button>
          <button className="btn btn-ghost" onClick={onClear} disabled={loading}>
            Clear
          </button>
          <select
            className="lang"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            title="Patient summary language"
          >
            <option value="en">Patient summary: English</option>
            <option value="es">Resumen del paciente: Español</option>
            <option value="fr">Résumé patient: Français</option>
            <option value="de">Patientenzusammenfassung: Deutsch</option>
          </select>
        </div>
      </div>
    </section>
  );
}
