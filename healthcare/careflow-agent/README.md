# CareFlow Agent 🩺

**An agentic AI clinical workflow assistant.**
Healthcare hackathon challenge: _“When Care Time Gets Lost in Complexity.”_

CareFlow Agent takes a doctor–patient consultation transcript and runs a
**multi-agent workflow** that supports the clinician — it extracts structured
facts, detects missing information, assesses risk/urgency, drafts SOAP
documentation, and writes a plain-language patient summary.

> ⚠️ **It does not diagnose patients or replace doctors.** It is decision-support:
> it surfaces information and risk signals, and **every case requires clinician review.**

---

## What it does

During real consultations, clinicians are under time pressure, patients describe
symptoms unclearly or forget details, and documentation is manual. CareFlow Agent
attacks all four problems at once:

| Problem | What CareFlow does |
|---|---|
| Information buried in conversation | **Extracts** structured clinical facts |
| Patients forget key details | **Flags missing info** + suggests the next best question |
| Risk is easy to miss under time pressure | **Classifies urgency** (low → emergency) with reasons |
| Documentation is slow & manual | **Generates** a SOAP note automatically |
| Patients don't understand medical language | **Writes** a simple, multilingual patient summary |

---

## Why it is agentic AI

This isn't a single prompt — it's a **coordinated team of specialist agents**, each
with one responsibility, run by an **orchestrator** that passes each agent's output
into the next and adapts the workflow to the result:

```
Transcript
   │
   ▼
1. Clinical Extractor ──▶ structured facts
   │
   ▼
2. Missing Information ──▶ gaps + next best question
   │
   ▼
3. Risk & Urgency ──▶ low / medium / high / emergency  (+ reasons)
   │                       │
   │            if HIGH/EMERGENCY → visible alert
   ▼
4. Documentation ──▶ SOAP note
   │
   ▼
5. Patient Communication ──▶ plain-language summary
   │
   ▼
Orchestrator ──▶ assembles the dashboard, records a step timeline
```

**Agentic properties on display:** role specialization, a multi-step pipeline where
each step consumes the previous one's output, conditional behavior (high risk →
alert; missing info → next-best-question), and a transparent run timeline.

### A deliberate safety design choice

The **generative** agents (Extractor, Documentation, Patient Communication) are
LLM-swappable. The **safety** agents (Risk & Urgency, Missing Information) are
**deterministic and rule-based on purpose** — triage and completeness logic must be
auditable and reproducible for clinicians, not a black box. This is a feature, not a
limitation: you can read exactly _why_ a case was flagged high risk.

---

## How the workflow works (the 6 agents)

All agents live in `src/lib/agents/`:

1. **`clinicalExtractor.ts`** — reads the transcript, extracts main complaint,
   symptoms (with detail like radiation/exertion), duration, severity, medical &
   family history, medications, allergies, lifestyle, vitals, patient concerns.
   Unknowns are explicit (`"Not specified"`); it never invents facts.
2. **`missingInfoAgent.ts`** — compares facts against a clinical intake checklist,
   lists what's missing (with priority), and proposes the single **next best question.**
3. **`riskAgent.ts`** — scores red-flag signals and classifies urgency as
   **low / medium / high / emergency** with explicit reasons and a recommended action.
   Always labelled _decision-support, not a diagnosis._
4. **`documentationAgent.ts`** — composes a professional **SOAP** note.
5. **`patientCommunicationAgent.ts`** — writes a short, plain-language (optionally
   multilingual) summary that avoids medical overconfidence.
6. **`orchestrator.ts`** — runs the pipeline in order, builds the run timeline, and
   reports whether it ran in **mock** or **LLM** mode.

---

## Mock mode vs. LLM mode

CareFlow runs **fully offline with zero API key** — deterministic agent outputs, ideal
for a reliable demo. To enable real LLM-backed generation, configure an
OpenAI-compatible provider (see below). If a key is set but a call fails, each
generative agent **silently falls back to its deterministic mock**, so the demo never
breaks.

The LLM layer (`src/lib/llm.ts`) speaks the OpenAI-compatible Chat Completions API.
**Switch providers by changing env vars only** — OpenAI, Groq, Azure OpenAI, a local
Ollama/LM Studio server, etc. To use a different SDK entirely (Anthropic, Vertex,
Bedrock), reimplement `callLLM` / `callLLMJson` in that one file; the agents don't change.

---

## How to run the app

Requirements: **Node.js 18+** (built and tested on Node 22).

```bash
cd healthcare/careflow-agent
npm install
npm run dev
# open http://localhost:3000
```

That's it — mock mode works immediately, no key required.

### Optional: enable real LLM calls

```bash
cp .env.example .env.local
# edit .env.local:
#   USE_LLM=true
#   LLM_API_KEY=sk-...
#   LLM_BASE_URL=https://api.openai.com/v1   (or any OpenAI-compatible endpoint)
#   LLM_MODEL=gpt-4o-mini
npm run dev
```

The key stays server-side (calls run in the `/api/careflow` route) and never reaches
the browser.

### Production build

```bash
npm run build && npm run start
```

---

## The demo scenario (≤ 60 seconds)

1. Open the app — the **chest-pressure** sample is pre-loaded (or click another
   sample chip / paste your own transcript).
2. Click **▶ Run CareFlow Agent.**
3. Watch the dashboard fill in:

For the canonical sample:

> Doctor: Hello, what brings you in today?
> Patient: I have had pressure in my chest since yesterday. It comes and goes.
> Patient: Sometimes I feel short of breath when walking.
> Patient: Yes, my father had heart problems.
> Patient: I take something for blood pressure, but I don't remember the name.

CareFlow produces:

- **Facts:** chest pressure (intermittent), shortness of breath (on exertion),
  duration "since yesterday", family history of heart disease, an unnamed BP
  medication (flagged amber as "Not specified").
- **Missing info:** pain intensity, exact location, radiation to arm/jaw/back,
  current vitals, medication name, allergy status.
- **Risk:** 🔴 **HIGH (81/100)** — chest pain + shortness of breath + family history +
  missing vitals. A high-risk alert appears at the top.
- **Next best question:** _“Can you rate the chest pressure from 1 to 10, and does it
  spread to your arm, jaw, or back?”_
- **Recommended action:** _“Escalate for clinician review and consider checking vitals
  and ECG.”_
- **SOAP note** + **patient-friendly summary**, each with a copy button.

Three sample cases are included to show the risk spectrum:
**chest pressure → High**, **headache → Medium**, **sore throat → Low**.
(A transcript with chest pain *radiating to arm/jaw* escalates to **Emergency**.)

---

## Project structure

```
src/
  app/
    page.tsx                 # dashboard (4 panels + alert + timeline)
    layout.tsx
    globals.css              # healthcare SaaS theme (white / soft blue-gray)
    api/careflow/route.ts    # server-side workflow endpoint
  components/
    TranscriptInput.tsx
    ClinicalFactsPanel.tsx
    RecommendationsPanel.tsx
    DocumentationPanel.tsx
    AgentTimeline.tsx
  lib/
    types.ts                 # all shared TypeScript types
    sampleData.ts            # demo consultations
    llm.ts                   # provider-neutral LLM layer (OpenAI-compatible)
    agents/
      clinicalExtractor.ts
      missingInfoAgent.ts
      riskAgent.ts
      documentationAgent.ts
      patientCommunicationAgent.ts
      orchestrator.ts
```

---

## Tech stack & design

- **Next.js 14 (App Router) + React 18 + TypeScript**
- Vanilla CSS design system (no UI framework — clean, fast, zero build risk)
- Provider-neutral OpenAI-compatible LLM layer
- No database, no auth — this is a focused hackathon prototype

**Design language — "clinical instrument".** Deliberately not the generic
blue-on-white healthcare-SaaS look. Petrol-teal + graphite on a paper canvas, a
strict semantic severity scale (red reserved only for high/emergency), and
distinctive typography via `next/font`:

- `Bricolage Grotesque` — display / headings
- `Hanken Grotesk` — body / UI
- `IBM Plex Mono` — every clinical data label, score, and code (reads like a
  medical-device readout)

Signature touches: a **circular vitals-monitor risk gauge** that sweeps to the
score, an animated **ECG trace** in the header, a numbered agent stepper,
staggered card reveals on load, and `prefers-reduced-motion` support.

## Notes & limitations

- The deterministic mock extractor is keyword/heuristic-driven — great for the demo
  cases; enable LLM mode for free-form robustness.
- Synthetic, anonymized data only. Not a medical device; not for clinical use.
- `npm audit` may report transitive build-time advisories from the Next 14 line;
  upgrading to Next 16 would clear them but is a breaking change out of scope here.
