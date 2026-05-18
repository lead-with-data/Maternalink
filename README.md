# 🌸 Maternalink — AI-Powered Maternal Health Intelligence Platform

> **Hackathon Project** — A full-stack digital health platform designed to dramatically reduce maternal mortality in rural Pakistan by connecting Lady Health Workers (LHWs), nurses, and administrators through AI-driven clinical decision support, real-time analytics, and a multilingual voice-powered data entry system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Portals](#user-portals)
- [Database Schema](#database-schema)
- [AI Services](#ai-services)
- [BigQuery Data Warehouse](#bigquery-data-warehouse)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [CLI Utilities](#cli-utilities)
- [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)

---

## Overview

Maternalink is a **server-side rendered (SSR) web application** built on AstroJS targeting frontline community healthcare workers in rural Pakistan. It digitizes the paper-based maternal health surveillance process and augments it with:

- 🤖 **Gemma 4 AI clinical decision support** — AI-powered risk analysis after every checkup
- 🎙️ **Urdu voice transcript data entry** — LHWs can speak in Urdu, transcript is analyzed for danger signs
- 📊 **Google BigQuery data warehouse** — real-time analytics dashboards for each user role
- ⚠️ **Automated emergency alerts** — triggered on HIGH/CRITICAL risk ratings
- 📈 **Time-series maternal telemetry** — longitudinal tracking of vitals across all visits
- 🔒 **Role-based access control** — Admin / Nurse / LHW / Patient portals, each with isolated views

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Astro 6 (SSR)](https://astro.build) with Node.js adapter |
| **Styling** | TailwindCSS 4 |
| **Database** | PostgreSQL via Supabase (cloud-hosted) |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **AI Engine** | OpenRouter API → `google/gemma-4-31b-it:free` |
| **Data Warehouse** | Google BigQuery (`@google-cloud/bigquery`) |
| **Auth** | JWT-based session cookies (via `lib/session.ts`) |
| **Deployment** | Local dev on `localhost:4321–4323` |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                             │
│  Patient Portal │ LHW Portal │ Nurse Portal │ Admin Portal           │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS / SSR
┌──────────────────────────▼───────────────────────────────────────────┐
│                    Astro SSR Server (Node.js)                        │
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────────────┐   │
│  │  Pages/SSR  │  │   API Routes    │  │   Middleware / Auth    │   │
│  │  (Astro)    │  │  /api/ai/chat   │  │   verifySession (JWT)  │   │
│  │             │  │  /api/ai/       │  │   Role-gate guards     │   │
│  │             │  │  transcribe     │  │                        │   │
│  └──────┬──────┘  └────────┬────────┘  └────────────────────────┘   │
│         │                  │                                         │
│  ┌──────▼──────────────────▼──────────────────────────────────────┐  │
│  │                    Service Layer                               │  │
│  │  openrouter.ts (Gemma AI)  │  bigquery.ts (DW Analytics)     │  │
│  └──────┬──────────────────────────────────────────┬─────────────┘  │
└─────────┼────────────────────────────────────────── ┼───────────────┘
          │                                           │
┌─────────▼──────────┐                    ┌──────────▼──────────────┐
│  Supabase PostgreSQL│                    │  Google BigQuery DW     │
│  (Transactional DB) │                    │  maternalink_analytics  │
│  Prisma ORM         │                    │  DimPatient             │
│                     │                    │  DimPregnancy           │
│  Users, Patients,   │ ──── Sync ────►   │  FactVisit              │
│  Pregnancies,       │  (on register/     │                         │
│  Visits, Alerts,    │   checkup)         │  lhwId-filtered queries │
│  AuditLogs          │                    │  for real-time KPIs     │
└─────────────────────┘                    └─────────────────────────┘
```

---

## User Portals

### 🔵 Patient Portal (`/patient/dashboard`)
- View own pregnancy timeline and all historical checkup vitals
- See AI-generated Urdu health advice from last visit
- Track BP, hemoglobin, weight, FHR time-series
- View assigned LHW contact info and next appointment

### 🟢 LHW Portal (`/lhw/dashboard`)
The primary data entry interface for frontline Lady Health Workers.

**KPI Metrics (Live from BigQuery):**
- **Assigned Cohort** — total mothers registered under this LHW
- **High-Risk Cases** — mothers with HIGH or CRITICAL risk rating
- **Checkups Logged** — total surveillance encounters documented

**Features:**
- Register new expectant mothers with full obstetric history (gravida, parity, education, socioeconomic, hospital distance, clean water access)
- Log clinical checkups with BP, hemoglobin, weight, FHR, pulse, temperature, oxygen saturation, urine protein, blood glucose, iron adherence
- Urdu voice transcript field — notes are analyzed by Gemma AI for danger signs
- AI-powered risk score and clinical decision support after every checkup
- Automated emergency alerts dispatched on HIGH/CRITICAL outcomes
- Full longitudinal patient cohort ledger with time-series vitals progression
- Pregnancy context panel showing previous BP trajectory, Hb trend, and medication history

**Data Warehouse Badge:**
- 🟢 **BigQuery Live DW Connected** — metrics served from real-time warehouse
- 🟡 **PostgreSQL Fail-Safe Active** — graceful fallback if BigQuery is unavailable

### 🟠 Nurse Portal (`/nurse/dashboard`)
- View all high-risk cases across assigned facility
- Resolve emergency alerts and update clinical notes
- Monitor incoming LHW checkup telemetry

### 🔴 Admin Portal (`/admin/dashboard`)
- **Fitbit-style Premium Command HQ** — overhanging warm dark-blend backdrop with glassmorphic dashboards
- **Two-Column Bento Command Deck** — Reorganized layout with wide Left Column (`lg:col-span-2`) for **Worker Registration & Table**, and single Right Column (`lg:col-span-1`) stacking the **Emergency Control Feed** and the **Platform Activity Audit Timeline** for high-density observational tracking.
- **User Management** — seamless portal to register and oversee frontline LHWs and clinical Nurses
- **Platform Activity Audit** — immutable system-wide timelines logging administrative and healthcare actions
- **Gemma Command AI assistant** — integrated floating administrative AI helper widget giving real-time data trends and population monitoring support

---

## Database Schema

```prisma
District → HealthFacility → User (ADMIN | NURSE | LHW)
                         → Patient → Pregnancy → Visit → Alert
                                                       → AuditLog
```

### Key Models

| Model | Purpose |
|---|---|
| `User` | Healthcare staff (Admin, Nurse, LHW) with role-based access |
| `Patient` | Expectant mother profile, linked to a specific LHW via `lhwId` |
| `Pregnancy` | Active or historical pregnancy record (gravida, parity, dates) |
| `Visit` | Clinical checkup: BP, Hb, weight, FHR, symptoms JSON, AI risk score |
| `Alert` | Emergency notification triggered by HIGH/CRITICAL risk visits |
| `AuditLog` | Immutable log of every clinical action for accountability |
| `HealthFacility` | Rural Health Clinic or BHU, linked to a District |

---

## AI Services

### `src/services/openrouter.ts`
- Calls OpenRouter API with the `google/gemma-4-31b-it:free` model
- Analyzes patient vitals + symptoms + voice transcript
- Returns:
  - `riskCategory`: `LOW | MEDIUM | HIGH_RISK | CRITICAL`
  - `score`: 0–100 distress index
  - `clinicalSummary`: Urdu advice card text
  - `recommendedActions`: medication/referral recommendations

### `src/pages/api/ai/chat.ts`
- REST endpoint for AI assistant chat interface used in patient portal

### `src/pages/api/ai/transcribe.ts`
- Processes Urdu voice transcripts for danger-sign extraction

---

## BigQuery Data Warehouse

### Architecture
The BigQuery warehouse (`maternalink_analytics`) runs a **star schema** with:

| Table | Description |
|---|---|
| `DimPatient` | Patient dimension — includes `lhwId` for LHW-level filtering |
| `DimPregnancy` | Pregnancy dimension |
| `FactVisit` | Visit fact table — clinical vitals, risk scores, medications |

### Key Functions in `src/services/bigquery.ts`

| Function | Purpose |
|---|---|
| `initializeBigQueryDataset()` | Creates dataset + tables if missing; auto-migrates missing schema fields |
| `streamDimensionToBigQuery(patient, pregnancy)` | Loads patient + pregnancy rows on registration |
| `streamVisitFactToBigQuery(visit, patientId)` | Loads checkup telemetry fact row |
| `getLHWBigQueryMetrics(lhwId)` | Executes live SQL to fetch KPIs filtered by LHW ID |

### Free-Tier Constraints
- Uses **batch load jobs** (`NEWLINE_DELIMITED_JSON`) — NOT streaming inserts (avoids billing)
- `DELETE` DML requires billing — use `table.delete()` + `dataset.createTable()` to truncate (used in rebuild script)
- Queries (`SELECT COUNT`) work on free tier without billing

### Data Sync Flow
1. LHW registers patient → `streamDimensionToBigQuery()` called immediately
2. LHW logs checkup → `streamVisitFactToBigQuery()` called after AI analysis
3. BigQuery batch job runs (1–2 min propagation delay)
4. Next dashboard load → `getLHWBigQueryMetrics()` returns updated counts

---

## Environment Setup

Copy the following into your `.env` file:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://..."

# OpenRouter AI (Gemma 4)
OPENROUTER_API_KEY="sk-or-v1-..."
GEMMA_MODEL="google/gemma-4-31b-it:free"

# JWT Session Auth
JWT_SECRET="your-secret-key"

# Google BigQuery Data Warehouse
GCP_PROJECT_ID="maternalink-analytics"
GCP_DATASET_ID="maternalink_analytics"
GOOGLE_APPLICATION_CREDENTIALS="maternalink-analytics-key.json"
```

Place `maternalink-analytics-key.json` (Google Service Account key) in the **project root**.

**Required GCP IAM Roles:**
- `roles/bigquery.dataEditor`
- `roles/bigquery.jobUser`

---

## Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

> Server starts at `http://localhost:4321` (may vary per terminal: 4322, 4323)

---

## CLI Utilities

| Command | Purpose |
|---|---|
| `npx tsx prisma/seed.ts` | Seeds the PostgreSQL database with test users, facilities, patients |
| `npx tsx prisma/backfill_bigquery.ts` | Syncs all existing PostgreSQL data into BigQuery warehouse |
| `npx tsx prisma/rebuild_bigquery.ts` | **Full rebuild** — drops + recreates BigQuery tables then reloads all clean data from Postgres |

> **Note:** `rebuild_bigquery.ts` should be used when BigQuery data becomes stale or polluted with test duplicates. It uses `table.delete()` + `createTable()` to bypass the free-tier DML restriction.

---

## Test Credentials

| Role | Mobile | Password |
|---|---|---|
| **LHW** | `03003333333` | `Maternalink123$` |
| **Patient (Sajida Bibi)** | `03001234567` | `Maternalink123$` |

---

## Project Structure

```
Maternalink/
├── prisma/
│   ├── schema.prisma              # Database schema (Prisma)
│   ├── seed.ts                    # Test data seeder
│   ├── backfill_bigquery.ts       # Sync Postgres → BigQuery
│   └── rebuild_bigquery.ts        # Full clean rebuild of BigQuery
│
├── src/
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── session.ts             # JWT session create/verify
│   │   └── hash.ts                # bcrypt password hashing
│   │
│   ├── services/
│   │   ├── openrouter.ts          # Gemma 4 AI risk analysis engine
│   │   └── bigquery.ts            # BigQuery DW streaming + querying
│   │
│   ├── pages/
│   │   ├── index.astro            # Landing page / marketing
│   │   ├── login.astro            # Unified login for all roles
│   │   ├── logout.ts              # Session cookie clear
│   │   ├── admin/dashboard.astro  # Admin analytics portal
│   │   ├── lhw/dashboard.astro    # LHW field data collection portal
│   │   ├── nurse/dashboard.astro  # Nurse clinical monitoring portal
│   │   ├── patient/dashboard.astro# Patient personal health portal
│   │   └── api/
│   │       └── ai/
│   │           ├── chat.ts        # AI chat assistant endpoint
│   │           └── transcribe.ts  # Urdu voice transcript endpoint
│   │
│   └── layouts/
│       └── Layout.astro           # Base HTML layout wrapper
│
├── public/                        # Static assets (images, icons)
├── maternalink-analytics-key.json # GCP Service Account key (DO NOT COMMIT)
├── .env                           # Environment variables (DO NOT COMMIT)
├── package.json
├── render.yaml                    # 🚀 Render.com Blueprint deployment spec
├── astro.config.mjs
├── context.md                     # 📘 Developer context & change log
└── README.md                      # 📖 This file
```

---

## ⚠️ Important Notes

- **Never commit** `.env` or `maternalink-analytics-key.json` to version control
- BigQuery batch load jobs have a **1–2 minute propagation delay** before counts update in the dashboard
- The app **auto-falls back** to PostgreSQL if BigQuery is unavailable — zero downtime for LHWs
- All clinical actions are immutably logged in `AuditLog` for accountability
- **Zero-Config Cloud Hosting Support** — In addition to reading the physical `maternalink-analytics-key.json` file, the BigQuery client automatically resolves inline `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY` environment variables. This enables zero-config deployment on Vercel and Render without physical key file requirements.
