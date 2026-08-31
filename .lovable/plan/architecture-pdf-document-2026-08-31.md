# Architecture PDF Document

Create a polished, downloadable PDF documenting QueueSense.ai's project structure and architecture — suitable for your SIH hackathon submission. The file will be delivered to your documents folder, not added to the codebase.

## Contents

1. **Cover / overview** — QueueSense.ai name, one-line pitch (privacy-conscious queue, crowd & service experience optimization), date.
2. **Technology stack** — table of layers: TanStack Start v1 + React 19, Vite, TanStack Router/Query, Tailwind v4 + shadcn, TypeScript.
3. **Directory structure** — annotated tree of `src/`: routes, lib (sim.ts, i18n.ts), components (ui/, charts), styles.
4. **Architecture diagram** — ASCII/box diagram showing the data flow:
   ```text
   Simulation engine (src/lib/sim.ts)
     → arrivals model (facility peak hours)
     → wait-time math (critical / priority / general)
     → counter allocation recommender (SLA-driven)
     → crowd density per zone
     → fairness & equity-gap scoring
        ↓
   React Query / state → Staff Control Room (/) & Visitor Token View (/token)
   ```
5. **Route inventory** — `/` (Control Room: KPIs, 3-hour forecast chart, counter overrides, audit log, escalation panel), `/token` (anonymous token, ETA, language switcher), `/about` (7-layer logic explainer).
6. **The 7 logic layers** — sensing, forecasting, wait-time estimation, allocation, priority rules, fairness, escalation — with the objective function (average wait + fairness for vulnerable/time-critical users).
7. **Privacy-by-design** — token-based anonymous sensing, aggregate headcounts only, no PII.
8. **How to run locally** — clone, Node 20+, `npm install`, `npm run dev` on localhost.

## Technical details

- Generated with Python + ReportLab into `/mnt/documents/` (e.g. `QueueSense_Architecture.pdf`).
- Uses a registered Unicode TTF (DejaVu Sans) so all characters render correctly.
- QA: convert every page to an image, inspect for clipped text, overlaps, bad spacing; fix and re-render until clean, then deliver.

## Verification

- Visually inspect every rendered page before delivering the PDF.
