# Private Compute

**Privacy by architecture, not policy.**

Private Compute demonstrates client-side analytics over sensitive datasets. Files are loaded into a browser-local PGlite database, persisted in IndexedDB, queried using PostgreSQL syntax, and summarized through aggregate-only reasoning tools. The server only delivers static application assets.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (client-side execution boundary)                       │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │ User Input   │    │ PGlite WASM (Postgres in browser)    │   │
│  │ CSV / JSON / │───▶│ IndexedDB persistence (idb://)       │   │
│  │ Synthetic    │    │ SQL execution, views, aggregates     │   │
│  └──────────────┘    └──────────────────────────────────────┘   │
│                               │                                 │
│                               ▼                                 │
│                      ┌────────────────────┐                     │
│                      │ Bounded Reasoning  │                     │
│                      │ Predefined tools   │                     │
│                      │ Aggregate-only     │                     │
│                      └────────────────────┘                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PRIVACY BOUNDARY — raw records do not cross this line          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SERVER (static assets only)                                    │
│  HTML, JS, CSS, WASM binaries                                   │
│  No API routes. No serverless functions.                        │
│  No telemetry containing uploaded data.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Claim

> A browser-delivered application can perform meaningful structured operations on sensitive records while keeping the raw dataset local to the user's machine.

The application demonstrates:

1. Data loaded locally (CSV upload, JSON paste, synthetic generator)
2. Data persisted locally using IndexedDB via PGlite `idb://` protocol
3. SQL queries executed locally using PGlite WASM
4. Derived summaries generated locally (risk bands, missingness, regional breakdowns)
5. No patient-level data sent to server endpoints
6. Reasoning agent constrained to aggregate-only predefined query tools

---

## Technology

| Component | Implementation |
|-----------|---------------|
| Runtime | Vite + React 19 (static client-side app) |
| Database | PGlite WASM (`@electric-sql/pglite`) — full Postgres in the browser |
| Persistence | IndexedDB (`idb://patient-demo`) |
| Validation | Zod schema contracts |
| Deployment | Static assets only (Vercel, Netlify, or any static host) |

---

## Privacy Guarantees

| Guarantee | Implementation |
|-----------|---------------|
| No patient upload requests | No API routes exist; server serves only static files |
| No PHI transmitted | PGlite runs entirely in-browser; data never leaves IndexedDB |
| Reasoning is bounded | Agent uses predefined aggregate tools only; cannot access raw rows |
| No arbitrary SQL via agent | Agent cannot execute custom SQL; only predefined queries |
| User SQL is local-only | SQL console executes against local PGlite; never transmitted |
| Clear data is complete | Deletes IndexedDB store; no server-side records exist |

---

## Agent Capability Matrix

| Can | Cannot |
|-----|--------|
| Query predefined aggregate views | Access raw patient rows |
| Report risk band distributions | Execute arbitrary SQL |
| Summarise missingness rates | Transmit data to external endpoints |
| Compare regional/age-band aggregates | Receive patient_id or row-level observations |

---

## DevTools Verification

1. Open browser DevTools → **Network** tab
2. Load sample data or upload a CSV
3. Observe: **no POST/PUT requests** are made after initial page load
4. All network activity is limited to static asset fetches (JS, CSS, WASM, fonts)
5. Filter by `Fetch/XHR` — should show zero requests after page load
6. The PGlite WASM binary is fetched once on first load, then cached

---

## Synthetic Data

The app generates ~200 realistic synthetic patient observations with:

- Correlated vitals (BP correlates with age, LDL with smoking status)
- Realistic missing data patterns (10-30% per field)
- ~60 distinct patients with multiple observations
- Postcode regions, diagnosis codes (ICD-10), medication counts

---

## Local Development

```bash
pnpm install
pnpm dev
```

## Build & Deploy

```bash
pnpm build
# Output: dist/public/ — deploy as static site
```

No environment variables required. No backend configuration needed.

---

## Data Contract

Patient observations are validated against this Zod schema before insertion:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| patient_id | string | yes | min 1 char |
| age_years | number | yes | 0–120 |
| sex | enum | yes | female, male, other, unknown |
| postcode_region | string | yes | min 1 char |
| observation_date | string | yes | date string |
| systolic_bp | number | no | nullable |
| diastolic_bp | number | no | nullable |
| heart_rate | number | no | nullable |
| hba1c | number | no | nullable |
| ldl_cholesterol | number | no | nullable |
| smoker | boolean | no | nullable |
| diagnosis_code | string | no | nullable |
| medication_count | number | no | nullable |

Records failing validation are rejected with field-level error messages.

---

## What This Is Not

- Not a healthcare product
- Not a production system
- Not a replacement for proper data governance
- Not a packet sniffer or network monitor

It is a proof of concept demonstrating an architectural pattern where sensitive data processing happens entirely client-side.
