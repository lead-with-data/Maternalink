# 📘 Maternalink — Developer Context & Change Log

> This file documents every major development decision, feature built, bug fixed, and architectural change made to the Maternalink platform. It is updated automatically after every significant change.

---

## 🗂️ Project Overview

**Maternalink** is an AI-powered maternal health platform for rural Pakistan, submitted as a hackathon project. It provides four role-based portals (Admin, Nurse, LHW, Patient) built on Astro SSR + PostgreSQL + Google BigQuery.

---

## 📅 Change Log

### [2026-05-18] — Dynamic Multi-Platform Deploy: Vercel SSR Integration

**What Changed:**
1. **Vercel Serverless Integration:** Installed and integrated the `@astrojs/vercel` serverless SSR adapter. 
2. **Conditional Build Orchestration:** Updated `astro.config.mjs` to dynamically load the Vercel serverless adapter when `process.env.DEPLOY_PLATFORM === 'vercel'` or if Vercel's native builder flag `process.env.VERCEL === '1'` is present, falling back to standard `@astrojs/node` when deploying on Render. This makes the Vercel build completely automatic without manual env configuration!
3. **Local Dry-Run Testing:** Successfully compiled and built both local targets (`@astrojs/node` standalone server and `@astrojs/vercel` serverless directory) with 100% success.
4. **Git Sync:** Ignored local `.vercel/` build artifacts and pushed all Vercel integration code to the remote repository.

---

### [2026-05-18] — Render.com Port-Binding & Interface Alignment Fixes

**What Changed:**
1. **Server Interface & Host Configuration:** Configured Astro's standalone server in `astro.config.mjs` to bind to `0.0.0.0` and port `10000` (Render's internal interface standard) instead of defaulting to `localhost`, which was causing Render's port-scanning health check to time out.
2. **Infrastructure Environment Alignment:** Updated the declarative `render.yaml` Blueprint to explicitly pass the `HOST` (`0.0.0.0`) and `PORT` (`10000`) environment variables to the Node SSR runner, and updated `GEMMA_MODEL` to target `google/gemma-2-9b-it:free`.

---

### [2026-05-18] — Gemma AI Assistant Fixes: Staff Authorization & OpenRouter Integration

**What Changed:**
1. **Endpoint Authorization Bypass:** Refactored the `/api/ai/chat` endpoint to allow all valid system roles (`PATIENT`, `LHW`, `NURSE`, `ADMIN`) to query the AI assistant, dynamically routing patients and clinical staff to their respective context-aware prompts.
2. **Invalid Model Identifier Resolution:** Fixed a configuration typo in `.env` where `GEMMA_MODEL` was set to an invalid model. Swapped it for `google/gemma-2-9b-it:free`, which is OpenRouter's official, highly reliable, and free state-of-the-art model.
3. **Staff Clinical Persona Implementation:** Created the `askClinicalAssistant` service function in `src/services/openrouter.ts` aligned with WHO and National Health guidelines, allowing senior administrators and LHWs to ask for real-time guidance on patient risk protocols.

---

### [2026-05-18] — Render.com Blueprint Infrastructure Setup

**What Changed:** Created a production-grade `render.yaml` infrastructure-as-code Blueprint specification file. This automates the setup of the Astro SSR server, runtime configurations, build targets, and securely maps all dynamic environment variables (including auto-generating `JWT_SECRET`).

---

### [2026-05-18] — Portable GCP Credentials & Secure Env Configuration

**What Changed:** Extracted GCP Service Account variables from `maternalink-analytics-key.json` and loaded them directly as portable environment variables in `.env`. Updated `src/services/bigquery.ts` to support both physical `.json` service key files and inline serverless/cloud environment variables. Verified that `.gitignore` successfully excludes `.env` and `maternalink-analytics-key.json` from git history to prevent secret leaks.

---

### [2026-05-18] — Admin Dashboard: District Command Center Redesign & AI Integration

**What Changed:** Redesigned `/admin/dashboard.astro` to match the premium warm, dark-blend glassmorphic theme from the Patient Portal. Removed the 3D map completely, expanded the emergency feed into a responsive full-width console, and integrated the Gemma AI assistant widget.

**Key Upgrades:**
1. **Background Style** — Applied the full-screen warm dark-blend backdrop with absolute depth: `background-image:linear-gradient(to bottom,rgba(28,20,33,.45),rgba(28,20,33,.75)),url('/login-signup.png')`
2. **Removed 3D Map** — Completely deleted the isometric 3D canvas map block and all rotation/drawing canvas scripts.
3. **Two-Column Bento Layout Grid** — Reorganized the dashboard into a gorgeous two-column bento-box. The **Left Column** (`lg:col-span-2`) holds the **Worker Registration Form** and **Workers Ledger Table** (giving wide tabular data maximum horizontal breathing room). The **Right Column** (`lg:col-span-1`) combines the **Emergency Control Feed** and the **Platform Activity Audit Log Timeline** in an elegant, high-density vertical stack. Alert cards stack in a single-column timeline with inline coordinates routing and dispatch commands.
4. **AI Assistant Orb** — Integrated the floating Gemma AI assistant widget (`#chat-toggle`) to provide administrative queries, clinical trends, and population monitoring insights.

---

### [2026-05-18] — Patient Dashboard: Fitbit-Style Maternal Health Redesign

**What Changed:** Complete redesign of `/patient/dashboard.astro` to a premium dark-mode Fitbit-style dashboard.

**New Layout & Features:**
1. **Dark glassmorphic theme** — `#0f0a14` base with frosted glass cards, `opacity-10` background image overlay
2. **Gestational Progress Ring** — Animated SVG circular ring showing pregnancy % completion (e.g. 32/40 weeks = 80% filled with peach→pink gradient)
3. **4 Vital KPI Cards** (Blood Pressure, Hemoglobin, Weight, Fetal Heart Rate) — each with inline sparkline SVG time-series from last 6 visits, color-coded red/amber/green based on clinical thresholds
4. **Inline Sparklines** — Generated server-side using `spark()` helper function, rendering `<polyline>` SVG paths from real visit data arrays
5. **Due Date + Countdown** — Days remaining to EDD with gravida/parity stats
6. **Checkup History ledger** — Last 4 visits shown inline with date, BP, risk badge
7. **Medications + LHW card** — Combined card with active meds and LHW contact
8. **Vitals Trend Chart** — Full-width SVG line chart: systolic BP (red) and Hb×10 (green dashed) over time
9. **Urdu AI Advice** — Gemma-generated card with RTL Urdu text and medication reminder
10. **🚨 SOS Emergency Button** — Pulsing red button in header; opens modal where patient writes emergency message, clicks send → shows "Alert sent to [LHW Name] · [mobile]" confirmation (1.2s delay simulation)
11. **Floating AI Chat** — Gradient (peach→pink) chat orb, dark glassmorphic chat window with Gemma health assistant

**Animations Added:**
- `.sos-btn` — box-shadow pulse at 2s intervals
- `.hb-icon` — heartbeat scale animation at 1.4s  
- `.ring-progress` — CSS transition on SVG `stroke-dashoffset` for smooth ring fill on load
- `.card-hover` — translateY(-3px) lift on hover

**Data Computed Server-Side:**
- `chartVisits` — last 6 visits in chronological order for sparklines
- `spark(data, width, height)` — maps data to SVG polyline coordinate string
- `gestPct`, `circumference`, `dashOffset` — SVG ring math
- `bpWarn`, `hbWarn` — boolean thresholds for conditional card coloring
- `daysUntilDue` — computed from `expectedDueDate`



**Problem:** The LHW dashboard KPI metrics (Assigned Cohort, High-Risk Cases, Checkups Logged) were reading directly from PostgreSQL only and not from the BigQuery data warehouse. The user wanted real-time, data-warehouse–backed metrics filtered specifically by the logged-in LHW's `user.id`.

**Root Cause of Stale/Inflated Metrics:** Before this fix, during development testing, the checkup form was submitted 114 times in rapid succession, generating 114 duplicate `Visit` records all with BP 138/88, Risk: CRITICAL. These were backfilled into BigQuery, causing counts of 117 High-Risk and 118 Checkups Logged.

**Changes Made:**

#### `src/services/bigquery.ts`
- Added `lhwId` field to `DimPatient` schema definition
- Updated `ensureTableExists()` to automatically detect and migrate missing schema columns by calling `table.setMetadata()` — no manual DDL needed
- Added `lhwId: patient.lhwId || null` to the `DimPatient` row in `streamDimensionToBigQuery()`
- Added new exported function `getLHWBigQueryMetrics(lhwId: string)` that executes:
  ```sql
  SELECT 
    COUNT(DISTINCT id) AS totalMothers,           -- from DimPatient WHERE lhwId = ?
    COUNT(DISTINCT v.id) AS activeReferralsCount,  -- FactVisit JOIN DimPatient WHERE HIGH/CRITICAL
    COUNT(DISTINCT v.id) AS totalVisits            -- FactVisit JOIN DimPatient
  ```
- Returns `null` on any error (triggers fallback in dashboard)

#### `src/pages/lhw/dashboard.astro`
- Added `getLHWBigQueryMetrics` to import statement
- Added BigQuery metrics query block after patient data load:
  - Tries `getLHWBigQueryMetrics(user.id)` — if successful, uses warehouse counts
  - Falls back to PostgreSQL-derived counts if BigQuery returns `null`
  - Sets `isFromDataWarehouse: boolean` flag
- Added dynamic connection status badge:
  - 🟢 **"BigQuery Live DW Connected"** (emerald, pulsing dot) when metrics come from warehouse
  - 🟡 **"PostgreSQL Fail-Safe Active"** (amber, pulsing dot) when fallback is used

#### Data Cleanup
- Ran `analyze_visits.ts` → discovered 117 visits on Sajida Bibi's pregnancy, 114 identical duplicates
- Ran `cleanup_visits.ts` → kept oldest 3 real visits, deleted 114 duplicates + their alerts from PostgreSQL
- Ran `rebuild_bigquery_clean.ts` → dropped all 3 BigQuery tables, recreated them, reloaded clean data
- **Final state:** 3 patients, 4 total real visits, 3 high-risk, BigQuery accurate

#### New Utility Scripts
- `prisma/rebuild_bigquery.ts` — drops + recreates BigQuery tables then reloads all Postgres data (safe for free tier, no DML billing needed)

---

### [2026-05-17] — LHW Portal Redesign & Time-Series Clinical Telemetry

**Problem:** The LHW portal had a green banner and unnecessary/confusing KPI metrics. User wanted simple, meaningful metrics like the Patient portal.

**Changes Made:**
- Removed green announcement banner from LHW portal header
- Removed irrelevant KPIs (Awaze Sehat, etc.)
- Replaced with 3 clean KPI cards: Assigned Cohort, High-Risk Cases, Checkups Logged
- Added longitudinal patient context panel showing:
  - BP time-series trajectory (e.g. `120/80 → 135/90 → 150/95 ⚠️ RISING`)
  - Hemoglobin trend with anemia warning flag if Hb < 10
  - Previous medication history (deduplicated)
  - Obstetric + socioeconomic metadata grid
- Added BMI auto-calculator on the checkup form (weight/height inputs)
- Added pregnancy context switcher dropdown per patient

---

### [2026-05-17] — Voice-Powered AI Data Entry Agent

**Problem:** LHWs needed to be able to speak about a patient (e.g., "Amna bibi has this condition...") and have the AI automatically fill in the form fields.

**Changes Made:**
- Added Urdu voice transcript textarea to the checkup form
- Voice transcript passed to Gemma 4 AI for clinical entity extraction
- AI analyzes transcript for: danger signs, symptoms, medications mentioned
- Transcript stored in `Visit.voiceTranscript` field
- If no AI summary available, falls back to transcript text

**Expanded Clinical Vitals Captured:**
- `pulse` (BPM)
- `temperature` (°F)
- `oxygenSat` (SpO2 %)
- `respiratoryRate` (breaths/min)
- `height` (meters, for BMI)
- `urineProtein` (None/Trace/+/++/+++)
- `fastingSugar` and `randomSugar` (mg/dL)
- `ironAdherence` (Yes/No)
- `missedDoses` (Yes/No)

All stored as JSON in `Visit.symptoms` column.

---

### [2026-05-17] — Google BigQuery Integration (Initial)

**Problem:** Needed analytics data warehouse for population-level metrics accessible by admin/nurse portals.

**Environment Variables Required:**
```env
GCP_PROJECT_ID=maternalink-analytics
GCP_DATASET_ID=maternalink_analytics
GOOGLE_APPLICATION_CREDENTIALS=maternalink-analytics-key.json
```

**Service Account Setup:**
1. Create GCP project `maternalink-analytics`
2. Enable BigQuery API
3. Create service account with `BigQuery Data Editor` + `BigQuery Job User` roles
4. Download JSON key → place as `maternalink-analytics-key.json` in project root

**Initial Schema:**
- `DimPatient` — patient dimension
- `DimPregnancy` — pregnancy dimension  
- `FactVisit` — clinical checkup fact table

**Implementation:**
- Used **batch load jobs** (NEWLINE_DELIMITED_JSON) instead of streaming inserts to stay on free tier
- Every patient registration → `streamDimensionToBigQuery()` called
- Every checkup → `streamVisitFactToBigQuery()` called after AI analysis
- `initializeBigQueryDataset()` called at server startup to auto-create missing tables/columns

---

### [2026-05-17] — Mother Registration: Obstetric History Collection

**Problem:** The registration form only captured basic demographics. Needed full obstetric + social history for AI risk stratification.

**New Fields Added to Registration Form:**
- `gravida` (number of pregnancies)
- `parity` (number of deliveries)
- `miscarriages`, `stillbirths`, `prematureBirths`, `neonatalDeaths`
- `cSections` (previous caesarean sections)
- `historyHemorrhage` (Yes/No)
- `education` (None/Primary/Secondary/University)
- `socioeconomic` (Low/Medium/High)
- `phoneOwnership` (None/Feature Phone/Smartphone)
- `hospitalDistance` (km to nearest hospital)
- `cleanWaterAccess` (Yes/No)
- `nutritionAccess` (Poor/Average/Good)
- `familyContact` (husband/family member contact number)

All stored as JSON in `Patient.address` column (repurposed as metadata store).

---

### [Early Sessions] — Core Platform Setup

**Stack Initialization:**
- Astro SSR with Node.js adapter
- TailwindCSS 4
- Prisma 7 + Supabase PostgreSQL
- JWT session cookies (HS256)
- Role-based guards on every portal page

**Database:**
- Supabase project: `qbnpdffwihxdpxzyjejz` (ap-northeast-1)
- Connection pooling via Supabase pooler

**Authentication Flow:**
1. `POST /login` → verify mobile + bcrypt password → create JWT cookie `maternalink_session`
2. Every protected page calls `verifySession(cookie)` → extracts `{ id, role, name }`
3. Role guard: redirect to `/login` if wrong role

**Portals Built:**
- `/` — Landing/marketing page
- `/login` — Unified login for all roles
- `/admin/dashboard` — Admin analytics
- `/lhw/dashboard` — LHW field portal (primary data entry)
- `/nurse/dashboard` — Nurse clinical monitoring
- `/patient/dashboard` — Patient personal health view

**AI Integration:**
- OpenRouter API → `google/gemma-4-31b-it:free` model
- Prompt includes: patient demographics, obstetric history, current vitals, previous visit history
- Structured JSON response parsing for risk category, score, advice

---

## 🔧 Known Issues & Gotchas

### BigQuery Free Tier Limitations
- `DELETE` DML requires billing — **do not use DELETE SQL**
- Use `table.delete()` (API, not SQL) + `dataset.createTable()` to truncate tables
- `SELECT COUNT` queries work without billing
- Batch load jobs work without billing
- ~1–2 minute propagation delay after load jobs before counts update in queries

### PostgreSQL Fallback
- If `getLHWBigQueryMetrics()` throws or returns null → dashboard silently uses PostgreSQL counts
- Dashboard always shows which source is active via the connection badge

### Test Data Pollution
- If metrics look wrong, check visit counts: `npx tsx analyze_visits.ts`
- If BigQuery is stale: run `npx tsx prisma/rebuild_bigquery.ts`

---

## 🗄️ Current Real Data State (as of 2026-05-18)

| Entity | Count |
|---|---|
| Patients | 3 (Sajida Bibi, Zainab Mai, Amna Bibi) |
| Active Pregnancies | 3 |
| Real Clinical Visits | 4 |
| High/Critical Risk Visits | 3 |
| LHW Users | 1 |
| BigQuery DimPatient rows | 3 |
| BigQuery FactVisit rows | 4 |

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `src/services/bigquery.ts` | BigQuery client, schema init, streaming, LHW metrics query |
| `src/services/openrouter.ts` | Gemma 4 AI risk analysis engine |
| `src/pages/lhw/dashboard.astro` | Main LHW portal with form + BigQuery KPIs |
| `src/pages/admin/dashboard.astro` | Admin portal |
| `src/pages/nurse/dashboard.astro` | Nurse portal |
| `src/pages/patient/dashboard.astro` | Patient health portal |
| `src/lib/session.ts` | JWT create/verify |
| `src/lib/db.ts` | Prisma client singleton |
| `prisma/schema.prisma` | Full database schema |
| `prisma/seed.ts` | Seeds test users, facilities, patients |
| `prisma/backfill_bigquery.ts` | Appends all Postgres data to BigQuery |
| `prisma/rebuild_bigquery.ts` | Full clean drop+rebuild of BigQuery tables |
| `maternalink-analytics-key.json` | GCP service account key (**never commit**) |
| `.env` | Environment variables (**never commit**) |
