# 🌸 Maternalink — AI-Powered Maternal Health Intelligence Platform

## 📋 Table of Contents
- [Executive Summary \& Motivation](#executive-summary--motivation)
- [The Solution: Maternalink Architecture](#the-solution-maternalink-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Portals \& Interfaces](#user-portals--interfaces)
- [Database Schema](#database-schema)
- [Privacy \& Anonymization Protocol](#privacy--anonymization-protocol)
- [Google BigQuery Data Warehouse](#google-bigquery-data-warehouse)
- [AI Risk Engine (Gemma)](#ai-risk-engine-gemma)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [CLI Utilities](#cli-utilities)
- [Test Credentials](#test-credentials)

---

## Executive Summary & Motivation

### The Crisis in Pakistan
Pakistan continues to face a major maternal health crisis. Hundreds of women die every year from preventable pregnancy and childbirth complications, especially in rural and underserved areas. Key medical causes include:
*   **Preeclampsia** (severe high blood pressure)
*   **Gestational diabetes**
*   **Severe anemia**
*   **Delayed emergency referrals**
*   **Lack of medical records** and **poor continuity of care**

According to reports from the **Gates Foundation**, **more than 150 women die per 100,000 live births in Pakistan**. The vast majority of these deaths are completely preventable with early screening and active continuity of care.

### Systemic Challenges
1.  **Paper-Based Records:** Frontline health workers carry heavy registers; records are frequently lost, torn, or inaccessible during emergencies.
2.  **No Follow-Up Tracking:** Mothers often visit clinics only once, leaving healthcare providers with no historical baseline or patient history.
3.  **Frontline Overload:** Overworked doctors and a lack of trained specialists in rural communities.
4.  **Low Literacy Gaps:** Traditional digital tools fail due to written Urdu literacy barriers.
5.  **Fragmented Health Systems:** No real-time connection between local field workers, health facility clinics, and district headquarters.

### The Luminary Collaboration
The collaboration between the **Gates Foundation**, **Lahore University of Management Sciences (LUMS)**, and **Aga Khan University (AKU)** represents one of Pakistan’s most important AI-driven maternal healthcare initiatives. 

At the center of this movement is **Dr. Maryam Mustafa**, whose pioneering work combines:
*   **Artificial Intelligence**
*   **Speech Recognition**
*   **Urdu/Local Language Interfaces**
*   **Digital Maternal Records**
*   **Human-Centered Design**
*   **Women’s Healthcare Accessibility**

Her flagship project, *Awaaz-e-Sehat*, is creating voice-driven AI systems for frontline health workers and pregnant women in low-resource settings. **Maternalink** is built directly in the spirit of this movement to bridge these critical healthcare gaps.

---

## The Solution: Maternalink Architecture
Maternalink is a **server-side rendered (SSR) cloud portal** built on AstroJS that digitizes the maternal health surveillance workflow. It provides real-time, bi-directional telemetry synchronizing local frontline checkups with facility staff, district supervisors, and AI research engines.

---

## Key Features

*   🎙️ **Urdu speech transcript data entry:** Health workers can dictate checkup observations in Urdu; Gemma AI parses the transcript for danger signs.
*   🤖 **Gemma AI Clinical Prognosis:** Custom LLM prompts evaluate blood pressure, hemoglobin, and symptoms to compute an automated distress score (0-100) and actionable Urdu guidance.
*   📊 **Dual-Layer Bi-directional Telemetry:** Checkups automatically flow into high-performance Google BigQuery data warehouse tables, with zero-downtime automatic fallback to local PostgreSQL transactions.
*   🔒 **Rigorous Privacy Compliance:** Enforces SHA-256 patient ID pseudonymization and strips all Personally Identifiable Information (PII) before serving telemetry to AI researchers.
*   👁️ **Expandable Cohort Ledger:** Clinical staff can click any patient row in the Unified Monitor to expand detailed history timelines, vitals progression, and Gemma insights.
*   🔬 **Interactive Labs & AI Explorer:** A dedicated research sandbox to live-query de-identified clinical datasets, featuring a reactive, interactive **cURL Code Generator**.
*   🚨 **Automated Emergency Control:** HIGH and CRITICAL risk levels trigger instant, high-visibility emergency dispatch alerts to facility clinical staff.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [Astro 6 (SSR)](https://astro.build) with Node.js Adapter |
| **Styling** | Custom HSL-tailored Premium Glassmorphic Vanilla CSS & TailwindCSS |
| **Transactional DB** | PostgreSQL hosted on Supabase |
| **ORM** | Prisma 7 |
| **AI LLM Engine** | OpenRouter API / Google Gemma AI |
| **Data Warehouse** | Google BigQuery (`@google-cloud/bigquery`) |
| **Session Control** | Secure JWT-based HTTP-only session cookies |

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Client Browser                                │
│    Patient Portal  │   Staff Dashboard   │   Admin Command Bento Deck       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTPS / SSR
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                         Astro SSR Node.js Server                           │
│   ┌──────────────┐   ┌───────────────────────┐   ┌──────────────────────┐  │
│   │  Astro SSR   │   │      API Routes       │   │  verifySession JWT   │  │
│   │    Pages     │   │     /api/labs/        │   │  Role-Gate Guards    │  │
│   └──────┬───────┘   └──────────┬────────────┘   └──────────────────────┘  │
│          │                      │                                          │
│   ┌──────▼──────────────────────▼──────────────────────────────────────┐  │
│   │                           Services                                 │  │
│   │      openrouter.ts (Gemma AI)  │  bigquery.ts (Google Cloud DW)    │  │
│   └──────┬──────────────────────────────────────────┬──────────────────┘  │
└──────────┼──────────────────────────────────────────┼─────────────────────┘
           │                                          │
┌──────────▼───────────┐                 ┌────────────▼─────────────┐
│ Supabase PostgreSQL  │                 │ Google BigQuery Warehouse│
│ (Transactional DB)   │ ─── Sync ─────► │ (Star Schema Warehouse)  │
│   Prisma ORM         │                 │   DimPatient, FactVisit  │
└──────────────────────┘                 └──────────────────────────┘
```

---

## User Portals & Interfaces

### 🔴 Admin Command Bento Deck (`/admin/dashboard`)
*   **Fitbit-Style Spatial Design:** Wrapped in elegant HSL gradient backdrop overlay.
*   **Two-Column Grid Layout:** High-density left column manages frontline staff credentials and registration; right column streams active emergency dispatch signals and system audit logs.
*   **Gemma Command Companion:** Live administrative chatbot designed to assist coordinators with real-time district statistics and resource dispatch.

### 🟣 Staff Command Dashboard (`/staff/dashboard`)
*   **Longitudinal Cohort Monitor:** Interactive ledger table featuring a click-to-expand details panel for every patient.
*   **Gemma LLM Prognosis Card:** Instantly previews complete time-series health advice and danger sign extractions.
*   **Urdu Voice Transcription Input:** Enables hands-free clinical checkup logging.
*   **Labs & AI Explorer Console:** Allows clinical researchers to query anonymized records, verify token authentication using `MATERNALINK_LABS_KEY_2026`, and copy real-time auto-generated cURL requests.

### 🔵 Patient Care Portal (`/patient/dashboard`)
*   **Visual Gestation Timeline:** Displays gestational weeks and risk categorizations clearly.
*   **Urdu Advice Hub:** Direct Arabic-script Urdu voice translation cards giving maternal guidance.
*   **Historical Trends:** Graphical telemetry tracking blood pressure and hemoglobin.

---

## Database Schema

```prisma
District ──► HealthFacility ──► User (ADMIN | STAFF)
                            ──► Patient ──► Pregnancy ──► Visit ──► Alert
```

*   `User`: Staff members (Coordinators, Clinicians, Field Workers) with secure role-based gating.
*   `Patient`: Mother records with demographic context (socioeconomic level, clean water, distance to clinic).
*   `Pregnancy`: Gestation timeline variables (gravida, parity, LMP).
*   `Visit`: Checkup vitals telemetry including systolic/diastolic BP, pulse, temp, Hb, SpO2, urine protein, and raw Urdu clinical speech records.
*   `Alert`: High-urgency notifications dispatched automatically upon critical vitals matches.

---

## Privacy & Anonymization Protocol

Maternalink implements standard-grade cryptographic de-identification to enforce researcher safety under `/api/labs`:
1.  **SHA-256 Pseudonyms:** Patient records are hashed:
    $$\text{Anonymized ID} = \text{SHA256}(\text{Patient ID} + \text{Salt})$$
2.  **PII Stripping:** Patient Names, CNIC numbers, Phone Numbers, and precise village locations are completely omitted from the JSON payloads.
3.  **Strict Gated Access:** Requests must be authenticated with the API key:
    `MATERNALINK_LABS_KEY_2026` passed via the `Authorization: Bearer <key>` header.

---

## Google BigQuery Data Warehouse

The platform uses a **star schema** to power real-time analytics KPIs:
*   `DimPatient`: Contextual pregnancy indicators.
*   `FactVisit`: Time-series factual measurements.

```sql
-- Sample BigQuery Analytics Query used internally
SELECT 
  COUNT(visitId) as total_checkups,
  AVG(CAST(riskScore AS FLOAT64)) as average_risk
FROM `maternalink-analytics.maternalink_analytics.FactVisit`
WHERE riskCategory = 'HIGH'
```

---

## AI Risk Engine (Gemma)

Built on OpenRouter utilizing `google/gemma-4-31b-it:free`. Vitals inputs are formulated as structured JSON context:
```json
{
  "systolic": 145,
  "diastolic": 95,
  "hemoglobin": 9.2,
  "symptoms": "High blood pressure, headache, vision blur"
}
```
The model extracts clinical risk categorizations, produces urgent clinical interventions, and formulates high-literacy Urdu advice:
> "فوری آرام کریں اور قریبی مرکز صحت سے رجوع کریں۔ اپنا بلڈ پریشر باقاعدگی سے چیک کروائیں۔"

---

## Environment Setup

Configure a `.env` file in the project root:

```env
# Database Credentials
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# JWT Token Secret
JWT_SECRET="maternalink-jwt-super-secret-key-2026"

# Gemma OpenRouter AI
OPENROUTER_API_KEY="sk-or-v1-..."
GEMMA_MODEL="google/gemma-4-31b-it:free"

# Google BigQuery Data Warehouse
GCP_PROJECT_ID="maternalink-analytics"
GCP_DATASET_ID="maternalink_analytics"

# Service Account Credentials (For Zero-Config Cloud hosting, paste values from key json)
GCP_CLIENT_EMAIL="maternalink-bq-writer@project.iam.gserviceaccount.com"
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ..."
```

---

## Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up Database & Schema:**
    ```bash
    npx prisma db push
    npx prisma generate
    ```
3.  **Seed Database:**
    ```bash
    npx tsx prisma/seed.ts
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *   Console starts on `http://localhost:10002`

---

## CLI Utilities

*   `npx tsx prisma/seed.ts` — Resets Supabase PostgreSQL and seeds pristine dummy clinical records.
*   `npx tsx prisma/backfill_bigquery.ts` — Syncs offline transactional database checkups directly to BigQuery tables.
*   `npx tsx prisma/rebuild_bigquery.ts` — Drops the BigQuery analytics schema and runs a clean tables re-creation cycle.

---

## Test Credentials

| Portal | Identifier / Mobile | Password / CNIC |
|---|---|---|
| **Admin Command HQ** | `03001111111` | `Maternalink123$` |
| **Staff Dashboard** | `03002222222` | `Maternalink123$` |
| **Patient Care View** | `03001234567` | `44301-1234567-8` |

---
*Maternalink — Empowering Frontline Maternal Healthcare with Safety, Dignity, and Intelligence.*
