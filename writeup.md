# Maternalink — Real-Time Obstetric AI Telemetry & Privacy-First Research Sandbox

## Project Writeup & Technical Submission

### Co-developed in the spirit of AI Accessibility and Frontline Motherhood Protection
*Bridging the gap between rural Pakistani health worker dictation, real-time Google BigQuery analytics, and Google Gemma AI risk analysis.*

## 1. Executive Summary & Problem Space

### The Maternal Health Crisis in Pakistan
According to **Gates Foundation** reports, Pakistan continues to face a critical maternal health crisis with **over 150 maternal deaths per 100,000 live births**. In rural and low-resource areas such as Tharparkar, access to timely obstetric care is severely limited. Pregnant women face lifethreatening complications from preventable conditions:
*   **Preeclampsia & Eclampsia** (pregnancy-induced high blood pressure)
*   **Gestational Diabetes**
*   **Severe Anemia**
*   **Delayed Emergency Referrals** due to paper-based record fragmentation

### The Systemic Failures of Traditional Digitization
1.  **Written Literacy & Language Barriers:** Traditional mobile/web checkup forms fail because frontline healthcare workers (such as LHWs) primarily speak Urdu and local dialects and struggle with complex English drop-down forms under heavy daily workloads.
2.  **Fragmented Baselines:** expectant mothers are often checked only once, leaving clinical facilities without any time-series record of blood pressure or hemoglobin trajectory.
3.  **Data Silos & Privacy Roadblocks:** Medical researchers need live patient telemetry to train predictive pregnancy models, but sharing active clinical datasets violates core PII (Personally Identifiable Information) laws.

## 2. The Maternalink Solution

Maternalink is a **server-side rendered (SSR) web console** built on AstroJS and Node.js. It acts as a real-time, bi-directional telemetry gateway connecting local health workers, clinic facility staff, district supervisors, and AI researchers.

## 3. Core AI Architecture & Gemma-4 Engine

Maternalink leverages Google's **Gemma** model (`google/gemma-4-31b-it:free`) via OpenRouter to serve as an intelligent, automated clinical decision support system.

### AI Risk Analysis Flow
Whenever a checkup is logged, Maternalink structures the clinical parameters (vitals, hemoglobin, weight, symptoms, and the health worker's dictation transcript) into a clean, context-rich prompt.

#### The AI Prompt Design:
```typescript
const prompt = `
You are an expert obstetrician AI assistant.
Analyze these clinical checkup metrics for an expectant mother:
- Gestational Age: ${gestationalWeeks} Weeks
- Blood Pressure: ${systolicBP}/${diastolicBP} mmHg
- Hemoglobin: ${hemoglobin} g/dL
- Pulse: ${pulse} bpm
- Symptoms/Urdu Voice Dictation Transcript: "${rawTranscript}"

Determine the clinical risk level: LOW, MEDIUM, HIGH, or CRITICAL.
Calculate a visual distress score (0-100%).
Provide clear, actionable Urdu advice for the mother (in Arabic script).
Recommend priority interventions for the health worker.

Respond strictly in this JSON format:
{
  "riskCategory": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskScore": number,
  "aiPrediction": "Urdu advice text...",
  "clinicalInterventions": ["intervention 1", "intervention 2"]
}
`;
```

### Prompt Safety & Output Reliability
By forcing a strict JSON schema parsing response, Maternalink guarantees that the client-side state machine can safely interpret the risk level to trigger emergency notifications or dispatch alerts instantly without risk of LLM formatting hallucinations.

## 4. Privacy-First Medical Research Sandbox (`/api/labs`)

A core innovation of Maternalink is the **Labs & AI Explorer Console**. It addresses the medical research bottleneck by serving a fully anonymized clinical dataset, gated behind the authorization key `MATERNALINK_LABS_KEY_2026`.

### Cryptographic Anonymization Protocol
To guarantee complete patient privacy while preserving longitudinal time-series integrity:
1.  **PII Stripping:** Patient Names, precise CNIC card numbers, Phone Numbers, and village locations are entirely omitted from the output dataset.
2.  **SHA-256 Pseudonymization:** Patient IDs are hashed securely:
    $$\text{Anonymized ID} = \text{SHA256}(\text{Patient ID} + \text{Internal Server Salt})$$
    This allows researchers to correlate historical checkups for the same patient over time without exposing their real-world identity.
3.  **Labs Console GUI:** Features a premium interactive query builder that compiles cURL commands in real time, letting researchers test API calls, see live JSON output, and copy working terminal scripts instantly.

## 5. Technical Architecture & Data Sync

Maternalink's technical ecosystem is built for high reliability and low latency, utilizing a modern, decoupled stack.

```
                                  ┌─────────────────────────────┐
                                  │      Browser Client         │
                                  │   (Patient/Staff/Admin)     │
                                  └──────────────┬──────────────┘
                                                 │ Astro SSR
┌────────────────────────────────────────────────▼────────────────────────────────┐
│                                   Astro SSR Node.js Server                      │
│                                                                                 │
│   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────┐   │
│   │     Dynamic Pages         │  │       REST API Gate       │  │ JWT Auth  │   │
│   │  - Patient Vitals Trends  │  │  - /api/labs              │  │  Gateway  │   │
│   │  - Expandable Ledger Row  │  │  - /api/ai/chat           │  │           │   │
│   └─────────────┬─────────────┘  └─────────────┬─────────────┘  └─────┬─────┘   │
│                 │                              │                      │         │
│   ┌─────────────▼──────────────────────────────▼──────────────────────▼─────┐   │
│   │                            Internal Service Layer                       │   │
│   │      openrouter.ts (Gemma AI)     │      bigquery.ts (Google Cloud DW)   │   │
│   └─────────────────────┬─────────────┴─────────────────────────────┬───────┘   │
└─────────────────────────┼───────────────────────────────────────────┼───────────┘
                          │                                           │
             ┌────────────▼────────────┐                ┌─────────────▼─────────────┐
             │ Supabase PostgreSQL DB  │                │  Google BigQuery Warehouse│
             │   (Transactional Data)  │ ─── Sync ───►  │    (Star Schema DW)       │
             │   Prisma 7 ORM          │                │   DimPatient, FactVisit   │
             └─────────────────────────┘                └───────────────────────────┘
```

### The BigQuery Star Schema
The Google BigQuery warehouse uses high-performance star schema modeling optimized for district metrics and LHW-level queries:
*   **`DimPatient` Table:** Housed demographics, water access, and geographic parameters.
*   **`DimPregnancy` Table:** Obstetric markers (gravida, parity, LMP).
*   **`FactVisit` Table:** Time-series factual measurements (systolic BP, pulse, Hb, weight, and Gemma AI scores).

### Zero-Downtime Database Fail-Safe
When the frontend database transaction completes:
1.  The visit record is logged locally on PostgreSQL.
2.  Maternalink asynchronously attempts to sync the record to BigQuery using JSON batch loading jobs (`NEWLINE_DELIMITED_JSON`) to avoid API streaming costs.
3.  If BigQuery variables are unconfigured or GCP sandboxing limits are reached, the dashboard immediately falls back to PostgreSQL transactions, ensuring **zero downtime** for frontline clinicians.

## 6. Elegant, Serene Frontend UX

Maternalink shuns default templates in favor of a customized, high-end design system tailored to maternal healthcare:

### The Fitbit-Style Admin Command Bento Deck
*   **Visual Polish:** A serene, premium blend of warm peach and light amethyst glows (`#fffbf9` to `#f4eef8`) with clean glassmorphic panels.
*   **Two-Column Grid Hierarchy:** The left column manages active health workers, and the right column maps active emergency dispatches and administrative audit timelines.
*   **Gemma Companion:** A floating conversational widget that helps administrators check population risk percentages and coordinate resources.

### The Unified Patient Cohort Ledger
*   **Click-to-Expand Vitals Details:** Clinical staff can click any patient row in the Ledger to reveal a beautiful, expandable in-line panel.
*   **Longitudinal History Cards:** Displays full clinical histories, graphing historical BP changes, hemoglobin counts, urinary protein levels, medications, and Urdu advice transcripts side by side.

## 7. Setup & Validation Guide

### Environment Variables (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="maternalink-session-jwt-key"

OPENROUTER_API_KEY="sk-or-v1-..."
GEMMA_MODEL="google/gemma-4-31b-it:free"

GCP_PROJECT_ID="maternalink-analytics"
GCP_DATASET_ID="maternalink_analytics"
GCP_CLIENT_EMAIL="maternalink-bq-writer@project.iam.gserviceaccount.com"
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA..."
```

### Command Line Tools
*   `npm install` — Installs standard dependencies.
*   `npx prisma db push && npx prisma generate` — Generates ORM clients.
*   `npx tsx prisma/seed.ts` — Resets local tables and seeds mock clinical histories.
*   `npx tsx prisma/backfill_bigquery.ts` — Backfills existing PostgreSQL data directly into Google BigQuery.
*   `npx tsx prisma/rebuild_bigquery.ts` — Drops BigQuery tables and reconstructs the data warehouse from clean Postgres seeds.

## 8. Summary of Clinical Impact
By translating dictation speech to structured vitals, parsing danger indicators using **Gemma AI**, and serving de-identified historical data via BigQuery to medical researchers, Maternalink represents a vital step forward in bridging clinical resources to Tharparkar and rural Pakistan—saving mothers' lives through safety, dignity, and modern technology.
