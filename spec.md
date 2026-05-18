# MaternaLink — Software Specification
### National Maternal Intelligence Infrastructure
**Version:** 1.0 | **Stack:** Next.js PWA · PostgreSQL · Python · Gemma LLM  
**Status:** Pre-development | **Target:** MVP Pilot — 1 district, 500–5,000 pregnancies

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Repository Structure](#3-repository-structure)
4. [Frontend Specification](#4-frontend-specification)
5. [Backend Specification](#5-backend-specification)
6. [Database Schema](#6-database-schema)
7. [Offline-First & Sync System](#7-offline-first--sync-system)
8. [AI & Risk Engine](#8-ai--risk-engine)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Notification System](#10-notification-system)
11. [API Reference](#11-api-reference)
12. [Environment & Configuration](#12-environment--configuration)
13. [Development Setup](#13-development-setup)
14. [Deployment](#14-deployment)
15. [Testing Strategy](#15-testing-strategy)
16. [Security Checklist](#16-security-checklist)

---

## 1. Project Overview

### 1.1 What We Are Building

MaternaLink is a **Progressive Web Application (PWA)** that functions as an offline-first maternal health intelligence platform. It connects lady health workers (LHWs) in rural areas, clinic nurses, district health officers, and government ministries into a single coordinated system.

The application has **five functional layers**, each independently useful but exponentially more powerful combined:

| Layer | Name | Primary Actor |
|---|---|---|
| L1 | Maternal Identity System | All users |
| L2 | Rural Data Collection Network | LHW, Nurse |
| L3 | AI Risk Detection Engine | System (automated) |
| L4 | Local Language Health Agent | Patient, LHW |
| L5 | Government Intelligence Dashboard | District Officer, Ministry |

### 1.2 Core Technical Requirements

| Requirement | Specification |
|---|---|
| **App Type** | Progressive Web App (PWA) — web only, no native app |
| **Offline** | Full functionality without internet. Data queued and synced when online. |
| **Devices** | Android 8+ / Chrome 90+ primary. Desktop Chrome/Edge for dashboard. |
| **Languages** | Urdu (primary), Pashto, Sindhi (Phase 2). English for admin/dashboard. |
| **Connectivity** | Designed for 2G/3G. All assets < 500KB initial load. |
| **Data Privacy** | Patient PII encrypted at rest (AES-256) and in transit (TLS 1.3) |
| **Scale (MVP)** | 5,000 patients · 100 health workers · 1 district |
| **Scale (Phase 4)** | 500,000 patients · 10,000 workers · national |

### 1.3 Non-Goals (MVP)

Do not build these in MVP. They will distract and delay:

- ❌ Native iOS or Android app
- ❌ Telemedicine / video consultation
- ❌ Payment or insurance module
- ❌ Real-time doctor messaging (alerts handle this)
- ❌ LLM chatbot as the primary data entry UI (forms first)
- ❌ National ID government API integration (Phase 4)
- ❌ iOS Safari offline support (IndexedDB limitations — Android first)
- ❌ Multi-country localization (design for it, don't activate it)

---

## 2. Architecture Overview

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  LHW App    │  │ Nurse/Clinic │  │  District Dashboard  │   │
│  │  (mobile)   │  │    App      │  │     (desktop)        │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘   │
│         │                │                     │               │
│  ┌──────▼────────────────▼─────────────────────▼───────────┐  │
│  │               Next.js App Router                         │  │
│  │         React · Tailwind · ShadCN UI                     │  │
│  └──────────────────────────┬────────────────────────────── ┘  │
│                             │                                   │
│  ┌──────────────────────────▼────────────────────────────── ┐  │
│  │              Service Worker (Workbox)                     │  │
│  │   Cache-first assets · Network-first API · Background Sync│  │
│  └──────────────────────────┬──────────────────────────── ── ┘  │
│                             │                                   │
│  ┌──────────────────────────▼────────────────────────────── ┐  │
│  │              IndexedDB (Dexie.js)                         │  │
│  │   patients · visits · sync_queue · alerts · cached_forms  │  │
│  └─────────────────────────────────────────────────────── ── ┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │  HTTPS / REST
                    ┌────────────▼────────────┐
                    │      API GATEWAY         │
                    │   (Nginx reverse proxy)  │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼─────────────────────┐
          │                      │                      │
 ┌────────▼────────┐  ┌──────────▼──────┐  ┌──────────▼────────┐
 │  Node.js API    │  │  Python Risk    │  │  Gemma LLM         │
 │  (Express)      │  │  Engine         │  │  Service           │
 │                 │  │                 │  │  (local/private)   │
 │  Auth · CRUD    │  │  Rules Engine   │  │  Language · Voice  │
 │  Sync · Alerts  │  │  ML scoring     │  │  Summarization     │
 └────────┬────────┘  └──────────┬──────┘  └──────────┬────────┘
          │                      │                      │
          └──────────────────────▼──────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼───────┐ ┌────────▼───────┐ ┌───────▼────────┐
     │  PostgreSQL +  │ │  Redis Cache   │ │  File Storage  │
     │  PostGIS       │ │  (sessions,    │ │  (S3/MinIO)    │
     │                │ │   alert queue) │ │                │
     └────────────────┘ └────────────────┘ └────────────────┘
```

### 2.2 Technology Stack — Final Decisions

#### Frontend
| Concern | Technology | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | PWA support, SSR for dashboard, file-based routing |
| Language | **TypeScript** | Type safety for medical data — non-negotiable |
| Styling | **Tailwind CSS + ShadCN UI** | Fast, accessible, consistent |
| Offline Storage | **Dexie.js** (IndexedDB wrapper) | Typed schemas, reactive queries, great DX |
| PWA / Caching | **Workbox + next-pwa** | Cache strategies, background sync |
| State Management | **Zustand** | Lightweight; works well with offline-first patterns |
| Forms | **React Hook Form + Zod** | Validation critical for medical data entry |
| Charts | **Recharts** | Lightweight; works offline once cached |
| Maps | **Leaflet.js** | Open-source; offline tile support available |
| HTTP Client | **TanStack Query** | Cache, stale-while-revalidate, retry on reconnect |
| Voice Input | **Web Speech API** | Native browser; no external dependency |

#### Backend
| Concern | Technology | Why |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Same language as frontend; large ecosystem |
| Framework | **Express.js** | Minimal, fast, well-understood |
| Language | **TypeScript** | Shared types with frontend via shared package |
| ORM | **Prisma** | Type-safe DB queries; migrations built in |
| Validation | **Zod** | Shared schemas with frontend |
| Queue | **BullMQ + Redis** | Alert processing, SMS queue, sync jobs |
| WebSockets | **Socket.io** | Real-time dashboard updates |

#### AI / Risk Engine
| Concern | Technology | Why |
|---|---|---|
| Language | **Python 3.11** | Best ML/health ecosystem |
| Framework | **FastAPI** | Async, fast, auto-docs |
| Rules Engine | **Custom Python** | Deterministic, testable, auditable |
| LLM | **Gemma 2B or 7B** | Open-source, locally deployable, fine-tunable |
| LLM Runtime | **Ollama** (dev) / **llama.cpp** (prod) | Local inference, no external API calls |
| Embeddings | **sentence-transformers** | Symptom similarity matching |

#### Infrastructure
| Concern | Technology |
|---|---|
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| File Storage | MinIO (self-hosted S3-compatible) or AWS S3 |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| SMS | Twilio (or local carrier: Jazz/Telenor API for Pakistan) |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Prometheus |

---

## 3. Repository Structure

```
maternalink/
│
├── apps/
│   ├── web/                        # Next.js PWA (main application)
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, register routes
│   │   │   ├── (lhw)/              # Lady Health Worker views
│   │   │   │   ├── dashboard/
│   │   │   │   ├── patients/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   └── register/
│   │   │   │   └── visits/
│   │   │   │       └── new/
│   │   │   ├── (nurse)/            # Clinic nurse views
│   │   │   │   ├── dashboard/
│   │   │   │   ├── patients/
│   │   │   │   └── alerts/
│   │   │   ├── (officer)/          # District officer / government views
│   │   │   │   ├── dashboard/
│   │   │   │   ├── analytics/
│   │   │   │   ├── map/
│   │   │   │   └── reports/
│   │   │   ├── (patient)/          # Patient self-service view
│   │   │   │   ├── timeline/
│   │   │   │   └── emergency/
│   │   │   └── api/                # Next.js API routes (thin proxy to backend)
│   │   ├── components/
│   │   │   ├── ui/                 # ShadCN base components
│   │   │   ├── forms/              # Medical data entry forms
│   │   │   ├── charts/             # Dashboard charts
│   │   │   ├── map/                # Leaflet map components
│   │   │   ├── alerts/             # Alert cards and banners
│   │   │   └── offline/            # Sync status, offline indicators
│   │   ├── lib/
│   │   │   ├── db/                 # Dexie IndexedDB setup and schemas
│   │   │   │   ├── schema.ts
│   │   │   │   ├── patients.ts
│   │   │   │   ├── visits.ts
│   │   │   │   └── sync-queue.ts
│   │   │   ├── sync/               # Sync engine
│   │   │   │   ├── processor.ts    # Main sync logic
│   │   │   │   ├── conflict.ts     # Conflict resolution
│   │   │   │   └── retry.ts
│   │   │   ├── risk/               # Client-side risk preview (not authoritative)
│   │   │   ├── i18n/               # Translations (Urdu, Pashto)
│   │   │   └── hooks/              # Custom React hooks
│   │   ├── public/
│   │   │   ├── manifest.json       # PWA manifest
│   │   │   ├── sw.js               # Service worker (generated by Workbox)
│   │   │   └── icons/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── api/                        # Node.js / Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── patients.ts
│       │   │   ├── pregnancies.ts
│       │   │   ├── visits.ts
│       │   │   ├── alerts.ts
│       │   │   ├── sync.ts         # Sync endpoint — most important
│       │   │   ├── dashboard.ts
│       │   │   └── workers.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts         # JWT verification
│       │   │   ├── rbac.ts         # Role-based access control
│       │   │   ├── audit.ts        # Audit logging middleware
│       │   │   └── rateLimit.ts
│       │   ├── services/
│       │   │   ├── alert.service.ts
│       │   │   ├── sms.service.ts
│       │   │   ├── risk.service.ts  # Calls Python risk engine
│       │   │   └── sync.service.ts
│       │   ├── jobs/               # BullMQ background jobs
│       │   │   ├── alertProcessor.ts
│       │   │   ├── smsDispatch.ts
│       │   │   └── riskRescore.ts
│       │   ├── db/
│       │   │   └── prisma.ts
│       │   └── index.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── services/
│   └── risk-engine/                # Python FastAPI risk engine
│       ├── app/
│       │   ├── main.py
│       │   ├── rules/
│       │   │   ├── bp.py           # Blood pressure rules
│       │   │   ├── anemia.py
│       │   │   ├── followup.py
│       │   │   ├── fetal.py
│       │   │   └── postpartum.py
│       │   ├── scoring/
│       │   │   ├── calculator.py   # Risk score aggregator
│       │   │   └── weights.py      # Tunable weights per rule
│       │   ├── llm/
│       │   │   ├── gemma.py        # Gemma interface
│       │   │   ├── prompts.py      # All system prompts
│       │   │   └── translator.py   # Alert → local language
│       │   └── models/
│       │       ├── visit.py        # Pydantic models
│       │       └── risk.py
│       ├── tests/
│       └── requirements.txt
│
└── packages/
    └── shared/                     # Shared TypeScript types
        ├── types/
        │   ├── patient.ts
        │   ├── pregnancy.ts
        │   ├── visit.ts
        │   ├── alert.ts
        │   └── user.ts
        └── schemas/                # Shared Zod schemas
            ├── visit.schema.ts
            └── patient.schema.ts
```

---

## 4. Frontend Specification

### 4.1 PWA Configuration

**`next.config.js`**
```js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // API calls: network first, fall back to cache
      urlPattern: /^https:\/\/api\.maternalink\.health\/v1\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      },
    },
    {
      // App shell: cache first
      urlPattern: /\.(js|css|woff2|png|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
      },
    },
  ],
});

module.exports = withPWA({
  experimental: { appDir: true },
  i18n: {
    locales: ['en', 'ur', 'ps'],
    defaultLocale: 'ur',
  },
});
```

**`public/manifest.json`**
```json
{
  "name": "MaternaLink",
  "short_name": "MaternaLink",
  "description": "Maternal health intelligence platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1B4F72",
  "theme_color": "#1ABC9C",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 4.2 IndexedDB Schema (Dexie.js)

**`apps/web/lib/db/schema.ts`**
```typescript
import Dexie, { Table } from 'dexie';

// --- Types ---
export interface LocalPatient {
  id: string;                    // local UUID
  serverId?: string;             // set after sync
  pregnancyId: string;
  name: string;
  phone?: string;
  address: string;
  dateOfBirth: string;
  bloodGroup: string;
  nationalId?: string;           // hashed client-side before storage
  assignedLhwId: string;
  facilityId: string;
  languagePreference: 'ur' | 'ps' | 'sd' | 'en';
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export interface LocalVisit {
  id: string;
  serverId?: string;
  pregnancyId: string;
  patientId: string;
  visitDate: string;
  workerId: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  hbLevel?: number;
  fetalHeartRate?: number;
  fundalHeightCm?: number;
  symptoms: string[];
  medications: string[];
  notes?: string;
  isHighRisk?: boolean;
  riskScore?: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdOfflineAt: string;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id?: number;                   // auto-increment
  entityType: 'patient' | 'visit' | 'alert_resolve';
  entityId: string;
  payload: string;               // JSON stringified
  attempts: number;
  lastAttemptAt?: string;
  syncStatus: 'pending' | 'processing' | 'failed';
  createdAt: string;
}

export interface LocalAlert {
  id: string;
  serverId?: string;
  pregnancyId: string;
  patientName: string;
  type: string;
  severity: 'medium' | 'high' | 'critical';
  message: string;
  messageUrdu?: string;
  resolvedAt?: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced';
}

// --- Database Class ---
export class MaternaDB extends Dexie {
  patients!: Table<LocalPatient>;
  visits!: Table<LocalVisit>;
  syncQueue!: Table<SyncQueueItem>;
  alerts!: Table<LocalAlert>;

  constructor() {
    super('MaternaLinkDB');
    this.version(1).stores({
      patients:  'id, serverId, pregnancyId, assignedLhwId, syncStatus',
      visits:    'id, serverId, pregnancyId, patientId, visitDate, syncStatus',
      syncQueue: '++id, entityType, syncStatus, createdAt',
      alerts:    'id, pregnancyId, severity, resolvedAt',
    });
  }
}

export const db = new MaternaDB();
```

### 4.3 Role-Based Routing

Each user role sees a completely different app shell. Role is stored in the JWT and read on first load:

```typescript
// apps/web/app/layout.tsx
const ROLE_HOME: Record<string, string> = {
  lhw:     '/lhw/dashboard',
  nurse:   '/nurse/dashboard',
  officer: '/officer/dashboard',
  admin:   '/admin/dashboard',
  patient: '/patient/timeline',
};
```

### 4.4 Key Components

#### Offline Status Banner
```typescript
// components/offline/OfflineBanner.tsx
'use client';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useSyncQueue } from '@/lib/hooks/useSyncQueue';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount } = useSyncQueue();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed top-0 w-full z-50 px-4 py-2 text-sm font-medium text-center
      ${isOnline ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'}`}>
      {isOnline
        ? `Syncing ${pendingCount} records...`
        : `Offline — ${pendingCount} records queued for upload`}
    </div>
  );
}
```

#### Visit Entry Form (core LHW form)
```typescript
// components/forms/VisitForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { visitSchema, VisitInput } from '@maternalink/shared/schemas/visit.schema';
import { saveVisitOffline } from '@/lib/db/visits';
import { addToSyncQueue } from '@/lib/sync/processor';

export function VisitForm({ pregnancyId, patientId }: Props) {
  const form = useForm<VisitInput>({
    resolver: zodResolver(visitSchema),
  });

  const onSubmit = async (data: VisitInput) => {
    // 1. Save to IndexedDB immediately — works offline
    const visit = await saveVisitOffline({ ...data, pregnancyId, patientId });

    // 2. Add to sync queue
    await addToSyncQueue({ entityType: 'visit', entityId: visit.id, payload: visit });

    // 3. Show success — even if offline
    toast.success('Visit saved. Will sync when online.');

    // 4. Trigger sync if online
    if (navigator.onLine) triggerSync();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Blood Pressure */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Systolic BP" unit="mmHg"
          {...form.register('bpSystolic', { valueAsNumber: true })}
          error={form.formState.errors.bpSystolic} />
        <Field label="Diastolic BP" unit="mmHg"
          {...form.register('bpDiastolic', { valueAsNumber: true })}
          error={form.formState.errors.bpDiastolic} />
      </div>

      {/* Hemoglobin */}
      <Field label="Hemoglobin" unit="g/dL"
        {...form.register('hbLevel', { valueAsNumber: true })}
        error={form.formState.errors.hbLevel} />

      {/* Weight */}
      <Field label="Weight" unit="kg"
        {...form.register('weightKg', { valueAsNumber: true })} />

      {/* Fetal Heart Rate */}
      <Field label="Fetal Heart Rate" unit="bpm"
        {...form.register('fetalHeartRate', { valueAsNumber: true })} />

      {/* Symptoms — multi-select */}
      <SymptomSelector control={form.control} name="symptoms" />

      {/* Notes — with voice input */}
      <VoiceTextarea label="Notes" {...form.register('notes')} lang="ur" />

      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save Visit
      </Button>
    </form>
  );
}
```

#### Voice Input Component
```typescript
// components/forms/VoiceTextarea.tsx
'use client';
import { useState, useRef } from 'react';

export function VoiceTextarea({ label, lang = 'ur', ...props }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new webkitSpeechRecognition();
    recognition.lang = lang === 'ur' ? 'ur-PK' : 'ps-AF';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      // Append to textarea value
      props.onChange?.({ target: { value: transcript } } as any);
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  return (
    <div className="relative">
      <textarea {...props} className="w-full p-3 border rounded-lg min-h-[100px]" />
      <button type="button" onClick={startListening}
        className={`absolute bottom-2 right-2 p-2 rounded-full
          ${listening ? 'bg-red-500 animate-pulse' : 'bg-teal-500'} text-white`}>
        🎤
      </button>
    </div>
  );
}
```

---

## 5. Backend Specification

### 5.1 API Structure

All API routes follow the pattern:
```
/api/v1/{resource}
```

Versioning is mandatory from day one. Breaking changes get `/api/v2/`.

### 5.2 Express App Setup

**`apps/api/src/index.ts`**
```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { authRouter } from './routes/auth';
import { patientsRouter } from './routes/patients';
import { visitsRouter } from './routes/visits';
import { syncRouter } from './routes/sync';
import { alertsRouter } from './routes/alerts';
import { dashboardRouter } from './routes/dashboard';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { errorHandler } from './middleware/error';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(compression());
app.use(express.json({ limit: '5mb' })); // sync payloads can be large

// Public routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes — auth required
app.use('/api/v1', authMiddleware);
app.use('/api/v1', auditMiddleware);
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/visits', visitsRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use(errorHandler);

export default app;
```

### 5.3 Sync Endpoint — Most Important Route

The sync endpoint is the most critical route in the entire system. It receives batches of offline data and processes them safely:

**`apps/api/src/routes/sync.ts`**
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { riskService } from '../services/risk.service';
import { alertService } from '../services/alert.service';

const router = Router();

const SyncPayloadSchema = z.object({
  items: z.array(z.object({
    entityType: z.enum(['patient', 'visit', 'alert_resolve']),
    entityId: z.string().uuid(),
    payload: z.record(z.any()),
    createdOfflineAt: z.string().datetime(),
  })),
  deviceId: z.string(),
  workerId: z.string().uuid(),
});

router.post('/', async (req, res) => {
  const parsed = SyncPayloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const results = [];

  for (const item of parsed.data.items) {
    try {
      let result;

      switch (item.entityType) {
        case 'visit':
          result = await processVisit(item.payload, item.entityId, req.user.id);
          break;
        case 'patient':
          result = await processPatient(item.payload, item.entityId, req.user.id);
          break;
        case 'alert_resolve':
          result = await processAlertResolve(item.payload, req.user.id);
          break;
      }

      results.push({
        entityId: item.entityId,
        status: 'synced',
        serverId: result.id,
      });

    } catch (error) {
      results.push({
        entityId: item.entityId,
        status: 'failed',
        error: error.message,
      });
    }
  }

  res.json({ results });
});

async function processVisit(payload: any, localId: string, workerId: string) {
  // 1. Check for duplicate (idempotent — safe to retry)
  const existing = await prisma.visit.findFirst({
    where: { localId }
  });
  if (existing) return existing;

  // 2. Validate pregnancy exists
  const pregnancy = await prisma.pregnancy.findUniqueOrThrow({
    where: { id: payload.pregnancyId }
  });

  // 3. Create the visit
  const visit = await prisma.visit.create({
    data: {
      localId,
      pregnancyId: payload.pregnancyId,
      visitDate: new Date(payload.visitDate),
      workerId,
      bpSystolic: payload.bpSystolic,
      bpDiastolic: payload.bpDiastolic,
      weightKg: payload.weightKg,
      hbLevel: payload.hbLevel,
      fetalHeartRate: payload.fetalHeartRate,
      fundalHeightCm: payload.fundalHeightCm,
      symptoms: payload.symptoms || [],
      medications: payload.medications || [],
      notes: payload.notes,
      createdOfflineAt: new Date(payload.createdOfflineAt),
    }
  });

  // 4. Run risk engine asynchronously — don't block sync response
  riskService.evaluate(pregnancy.id).catch(console.error);

  return visit;
}
```

### 5.4 Services

#### Risk Service
```typescript
// apps/api/src/services/risk.service.ts
import axios from 'axios';
import { prisma } from '../db/prisma';
import { alertService } from './alert.service';

export const riskService = {
  async evaluate(pregnancyId: string) {
    // 1. Fetch last 10 visits for this pregnancy
    const visits = await prisma.visit.findMany({
      where: { pregnancyId },
      orderBy: { visitDate: 'desc' },
      take: 10,
    });

    const pregnancy = await prisma.pregnancy.findUniqueOrThrow({
      where: { id: pregnancyId },
      include: { patient: true },
    });

    // 2. Send to Python risk engine
    const response = await axios.post(
      `${process.env.RISK_ENGINE_URL}/evaluate`,
      { pregnancy, visits }
    );

    const { riskScore, riskLevel, triggeredAlerts } = response.data;

    // 3. Update pregnancy risk level in DB
    await prisma.pregnancy.update({
      where: { id: pregnancyId },
      data: { riskScore, riskLevel, lastEvaluatedAt: new Date() },
    });

    // 4. Create and dispatch any triggered alerts
    for (const alert of triggeredAlerts) {
      await alertService.create({
        pregnancyId,
        ...alert,
      });
    }

    return { riskScore, riskLevel };
  },
};
```

#### Alert Service
```typescript
// apps/api/src/services/alert.service.ts
import { prisma } from '../db/prisma';
import { smsService } from './sms.service';
import { alertQueue } from '../jobs/alertProcessor';

export const alertService = {
  async create(data: CreateAlertInput) {
    // 1. Check if same alert type already open for this pregnancy
    const existing = await prisma.alert.findFirst({
      where: {
        pregnancyId: data.pregnancyId,
        type: data.type,
        resolvedAt: null,
      }
    });
    if (existing) return existing; // Don't duplicate alerts

    // 2. Create alert
    const alert = await prisma.alert.create({ data });

    // 3. Queue for routing (who gets notified depends on severity)
    await alertQueue.add('route-alert', { alertId: alert.id });

    return alert;
  },

  async route(alertId: string) {
    const alert = await prisma.alert.findUniqueOrThrow({
      where: { id: alertId },
      include: {
        pregnancy: {
          include: {
            patient: true,
            assignedLhw: true,
            facility: true,
          }
        }
      }
    });

    const routes = getAlertRoutes(alert.severity);

    if (routes.notifyLhw && alert.pregnancy.assignedLhw) {
      await smsService.send({
        to: alert.pregnancy.assignedLhw.phone,
        message: alert.messageUrdu || alert.message,
      });
    }

    if (routes.notifyFacility && alert.pregnancy.facility) {
      await smsService.send({
        to: alert.pregnancy.facility.phone,
        message: `URGENT: ${alert.pregnancy.patient.name} — ${alert.message}`,
      });
    }

    // Push to dashboard WebSocket for real-time officer view
    if (routes.notifyOfficer) {
      io.to(`district:${alert.pregnancy.districtId}`).emit('new-alert', alert);
    }
  },
};

function getAlertRoutes(severity: string) {
  return {
    medium:   { notifyLhw: true,  notifyFacility: false, notifyOfficer: false },
    high:     { notifyLhw: true,  notifyFacility: false, notifyOfficer: true  },
    critical: { notifyLhw: true,  notifyFacility: true,  notifyOfficer: true  },
  }[severity] ?? { notifyLhw: true, notifyFacility: false, notifyOfficer: false };
}
```

---

## 6. Database Schema

### 6.1 Prisma Schema

**`apps/api/prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── GEOGRAPHY ────────────────────────────────────────────────────────────

model District {
  id         String     @id @default(uuid())
  name       String
  province   String
  country    String     @default("PK")
  facilities Facility[]
  workers    HealthWorker[]
  createdAt  DateTime   @default(now())
}

model Facility {
  id            String      @id @default(uuid())
  name          String
  type          FacilityType
  districtId    String
  district      District    @relation(fields: [districtId], references: [id])
  address       String
  phone         String?
  latitude      Float?
  longitude     Float?
  referralLevel Int         @default(1)  // 1=primary, 2=secondary, 3=tertiary
  pregnancies   Pregnancy[]
  workers       HealthWorker[]
  createdAt     DateTime    @default(now())

  @@index([districtId])
}

enum FacilityType {
  rural_health_center
  basic_health_unit
  district_hospital
  tertiary_hospital
}

// ─── USERS & WORKERS ──────────────────────────────────────────────────────

model User {
  id           String       @id @default(uuid())
  email        String?      @unique
  phone        String       @unique
  passwordHash String
  role         UserRole
  isActive     Boolean      @default(true)
  worker       HealthWorker?
  sessions     Session[]
  auditLogs    AuditLog[]
  createdAt    DateTime     @default(now())
}

enum UserRole {
  lhw
  nurse
  clinician
  district_officer
  ngo_manager
  admin
  patient
}

model HealthWorker {
  id           String     @id @default(uuid())
  userId       String     @unique
  user         User       @relation(fields: [userId], references: [id])
  name         String
  districtId   String
  district     District   @relation(fields: [districtId], references: [id])
  facilityId   String?
  facility     Facility?  @relation(fields: [facilityId], references: [id])
  phone        String
  languages    String[]   @default(["ur"])
  assignedPatients Pregnancy[] @relation("AssignedLhw")
  visits       Visit[]
  createdAt    DateTime   @default(now())
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  deviceId  String?
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
}

// ─── PATIENTS & PREGNANCIES ───────────────────────────────────────────────

model Patient {
  id                  String      @id @default(uuid())
  nationalIdHash      String?     // SHA-256 of national ID — never store plaintext
  name                String
  dateOfBirth         DateTime?
  phone               String?
  address             String
  districtId          String
  bloodGroup          String?
  emergencyContactName   String?
  emergencyContactPhone  String?
  languagePreference  String      @default("ur")
  pregnancies         Pregnancy[]
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@index([nationalIdHash])
  @@index([phone])
}

model Pregnancy {
  id             String          @id @default(uuid())
  pregnancyCode  String          @unique  // PREG-XXXX-XXXX-YYYY
  patientId      String
  patient        Patient         @relation(fields: [patientId], references: [id])
  assignedLhwId  String?
  assignedLhw    HealthWorker?   @relation("AssignedLhw", fields: [assignedLhwId], references: [id])
  facilityId     String?
  facility       Facility?       @relation(fields: [facilityId], references: [id])
  districtId     String

  // Obstetric data
  lmpDate        DateTime?       // Last menstrual period
  edd            DateTime?       // Estimated due date
  gravida        Int?            // Total pregnancies including current
  parity         Int?            // Previous deliveries
  previousLosses Int             @default(0)

  // Risk
  riskScore      Float           @default(0)
  riskLevel      RiskLevel       @default(low)
  lastEvaluatedAt DateTime?

  // Status
  status         PregnancyStatus @default(active)
  deliveryDate   DateTime?
  deliveryOutcome String?

  visits         Visit[]
  alerts         Alert[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([patientId])
  @@index([riskLevel])
  @@index([districtId])
  @@index([status])
}

enum RiskLevel {
  low
  medium
  high
  critical
}

enum PregnancyStatus {
  active
  delivered
  lost
  transferred
}

// ─── VISITS ───────────────────────────────────────────────────────────────

model Visit {
  id               String       @id @default(uuid())
  localId          String       @unique  // Client-generated UUID for deduplication
  pregnancyId      String
  pregnancy        Pregnancy    @relation(fields: [pregnancyId], references: [id])
  workerId         String
  worker           HealthWorker @relation(fields: [workerId], references: [id])

  visitDate        DateTime
  visitType        VisitType    @default(antenatal)

  // Vitals
  bpSystolic       Int?
  bpDiastolic      Int?
  weightKg         Float?
  hbLevel          Float?
  fetalHeartRate   Int?
  fundalHeightCm   Float?
  urineProtein     String?      // negative / trace / +1 / +2 / +3
  bloodSugar       Float?

  // Subjective
  symptoms         String[]
  medications      String[]
  notes            String?

  // AI output
  riskScoreAtVisit Float?
  alertsTriggered  String[]

  // Sync metadata
  createdOfflineAt DateTime
  createdAt        DateTime     @default(now())

  @@index([pregnancyId])
  @@index([workerId])
  @@index([visitDate])
}

enum VisitType {
  antenatal
  postnatal
  emergency
  followup
}

// ─── ALERTS ───────────────────────────────────────────────────────────────

model Alert {
  id           String      @id @default(uuid())
  pregnancyId  String
  pregnancy    Pregnancy   @relation(fields: [pregnancyId], references: [id])

  type         String      // 'preeclampsia_risk' | 'severe_anemia' | 'missed_followup' | etc.
  severity     AlertSeverity
  message      String
  messageUrdu  String?
  triggerRule  String      // which rule fired
  triggerData  Json        // the data that triggered it (for audit)

  resolvedAt   DateTime?
  resolvedById String?
  resolvedNote String?

  notifiedLhw      Boolean @default(false)
  notifiedFacility Boolean @default(false)
  notifiedOfficer  Boolean @default(false)

  createdAt    DateTime    @default(now())

  @@index([pregnancyId])
  @@index([severity])
  @@index([resolvedAt])
}

enum AlertSeverity {
  medium
  high
  critical
}

// ─── AUDIT ────────────────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String   // 'read' | 'create' | 'update' | 'delete'
  resource   String   // 'patient' | 'visit' | 'alert' | etc.
  resourceId String?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([resourceId])
  @@index([createdAt])
}
```

---

## 7. Offline-First & Sync System

### 7.1 The Sync Lifecycle

```
[User enters visit data]
         │
         ▼
[Save to IndexedDB immediately]     ← Works 100% offline
         │
         ▼
[Add to SyncQueue]
         │
    ┌────▼────────────────────────────────────────┐
    │       Is device online?                      │
    └────┬──────────────────────────┬─────────────┘
       YES                          NO
         │                          │
         ▼                          ▼
[Trigger immediate sync]    [Register Background Sync]
         │                          │
         │                   [Browser fires sync event]
         │                   [when connectivity returns]
         │                          │
         └──────────┬───────────────┘
                    │
                    ▼
         [POST /api/v1/sync with batch]
                    │
         ┌──────────▼──────────┐
         │   Server processes   │
         │   each item          │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────────────────┐
         │   Success?                       │
         ├── YES → Update IndexedDB         │
         │         syncStatus = 'synced'    │
         │         serverId populated       │
         ├── CONFLICT → Flag for review     │
         │             syncStatus='conflict'│
         └── FAIL → Retry with backoff      │
                    max 5 attempts          │
                    then alert admin        │
         └──────────────────────────────────┘
```

### 7.2 Sync Processor

**`apps/web/lib/sync/processor.ts`**
```typescript
import { db } from '../db/schema';
import { apiClient } from '../api/client';

const MAX_RETRY_ATTEMPTS = 5;
const BATCH_SIZE = 50;

export async function processSyncQueue(): Promise<void> {
  const pending = await db.syncQueue
    .where('syncStatus').equals('pending')
    .and(item => (item.attempts ?? 0) < MAX_RETRY_ATTEMPTS)
    .limit(BATCH_SIZE)
    .toArray();

  if (pending.length === 0) return;

  // Mark as processing to prevent duplicate processing
  await db.syncQueue
    .where('id').anyOf(pending.map(i => i.id!))
    .modify({ syncStatus: 'processing' });

  try {
    const response = await apiClient.post('/sync', {
      items: pending.map(item => ({
        entityType: item.entityType,
        entityId: item.entityId,
        payload: JSON.parse(item.payload),
        createdOfflineAt: item.createdAt,
      })),
      deviceId: getDeviceId(),
      workerId: getCurrentWorkerId(),
    });

    // Process results
    for (const result of response.data.results) {
      const queueItem = pending.find(p => p.entityId === result.entityId);
      if (!queueItem) continue;

      if (result.status === 'synced') {
        // Update the actual entity with server ID
        await updateEntityServerId(queueItem.entityType, result.entityId, result.serverId);
        // Remove from queue
        await db.syncQueue.delete(queueItem.id!);
      } else if (result.status === 'conflict') {
        await db.syncQueue.update(queueItem.id!, { syncStatus: 'failed' });
        await markEntityConflict(queueItem.entityType, result.entityId);
      } else {
        // Failed — put back with incremented attempt count
        await db.syncQueue.update(queueItem.id!, {
          syncStatus: 'pending',
          attempts: (queueItem.attempts ?? 0) + 1,
          lastAttemptAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    // Network error — put everything back
    await db.syncQueue
      .where('id').anyOf(pending.map(i => i.id!))
      .modify(item => {
        item.syncStatus = 'pending';
        item.attempts = (item.attempts ?? 0) + 1;
      });
  }
}

// Register with Service Worker Background Sync API
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('sync-visits');
    });
  }
}

// Called from service worker when sync event fires
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-visits') {
    event.waitUntil(processSyncQueue());
  }
});
```

### 7.3 Conflict Resolution Rules

| Conflict Type | Resolution Strategy |
|---|---|
| Same visit submitted twice (duplicate) | Server detects by `localId`. Second submission ignored silently. |
| Visit data edited both offline and online | Server version wins. Offline version flagged as `conflict` for nurse review. |
| Patient demographics changed offline and online | Merge non-null fields. Flag for admin review if same field differs. |
| Alert resolved offline but patient transferred | Alert kept resolved. Transfer note added. |

---

## 8. AI & Risk Engine

### 8.1 FastAPI Application

**`services/risk-engine/app/main.py`**
```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
from .rules.bp import check_bp_rules
from .rules.anemia import check_anemia_rules
from .rules.followup import check_followup_rules
from .rules.fetal import check_fetal_rules
from .rules.postpartum import check_postpartum_rules
from .scoring.calculator import calculate_risk_score

app = FastAPI(title="MaternaLink Risk Engine", version="1.0.0")

class Visit(BaseModel):
    visitDate: str
    bpSystolic: Optional[int] = None
    bpDiastolic: Optional[int] = None
    weightKg: Optional[float] = None
    hbLevel: Optional[float] = None
    fetalHeartRate: Optional[int] = None
    symptoms: List[str] = []
    visitType: str = "antenatal"

class Pregnancy(BaseModel):
    id: str
    lmpDate: Optional[str] = None
    edd: Optional[str] = None
    gravida: Optional[int] = None
    parity: Optional[int] = None
    previousLosses: int = 0
    status: str = "active"

class EvaluationRequest(BaseModel):
    pregnancy: Pregnancy
    visits: List[Visit]

class Alert(BaseModel):
    type: str
    severity: str  # 'medium' | 'high' | 'critical'
    message: str
    messageUrdu: Optional[str] = None
    triggerRule: str
    triggerData: dict

class EvaluationResponse(BaseModel):
    riskScore: float
    riskLevel: str
    triggeredAlerts: List[Alert]
    factors: dict

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_pregnancy(req: EvaluationRequest):
    alerts = []
    factors = {}

    # Run all rule modules
    alerts += check_bp_rules(req.visits, factors)
    alerts += check_anemia_rules(req.visits, factors)
    alerts += check_followup_rules(req.pregnancy, req.visits, factors)
    alerts += check_fetal_rules(req.visits, factors)
    alerts += check_postpartum_rules(req.pregnancy, req.visits, factors)

    # Calculate aggregate score
    risk_score, risk_level = calculate_risk_score(factors, req.pregnancy)

    return EvaluationResponse(
        riskScore=risk_score,
        riskLevel=risk_level,
        triggeredAlerts=alerts,
        factors=factors,
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 8.2 Blood Pressure Rules

**`services/risk-engine/app/rules/bp.py`**
```python
from typing import List, Tuple
from datetime import datetime, timedelta

def check_bp_rules(visits: list, factors: dict) -> list:
    alerts = []
    recent_bp = [
        v for v in visits
        if v.bpSystolic is not None and v.bpDiastolic is not None
    ]

    if not recent_bp:
        return alerts

    latest = recent_bp[0]
    sys = latest.bpSystolic
    dia = latest.bpDiastolic

    # Rule 1: Severe hypertension (any single reading)
    if sys >= 160 or dia >= 110:
        alerts.append({
            "type": "severe_hypertension",
            "severity": "critical",
            "message": f"BP {sys}/{dia} — severe hypertension. Immediate referral required.",
            "messageUrdu": f"بلڈ پریشر {sys}/{dia} — فوری اسپتال بھیجیں",
            "triggerRule": "bp.severe_hypertension",
            "triggerData": {"systolic": sys, "diastolic": dia},
        })
        factors["bp_risk"] = 40
        return alerts  # No point checking lower thresholds

    # Rule 2: Preeclampsia risk (≥140/90 on two readings within 7 days)
    if sys >= 140 or dia >= 90:
        week_ago = datetime.now() - timedelta(days=7)
        elevated_in_week = [
            v for v in recent_bp
            if (datetime.fromisoformat(v.visitDate) >= week_ago
                and (v.bpSystolic >= 140 or v.bpDiastolic >= 90))
        ]
        if len(elevated_in_week) >= 2:
            alerts.append({
                "type": "preeclampsia_risk",
                "severity": "high",
                "message": "BP elevated on 2+ readings this week — preeclampsia risk.",
                "messageUrdu": "ہفتے میں دو بار بلڈ پریشر زیادہ — فوری جانچ کروائیں",
                "triggerRule": "bp.preeclampsia_risk",
                "triggerData": {"readings": len(elevated_in_week)},
            })
            factors["bp_risk"] = 25
        else:
            # Single elevated reading — medium alert
            alerts.append({
                "type": "elevated_bp",
                "severity": "medium",
                "message": f"BP {sys}/{dia} — elevated. Monitor closely.",
                "triggerRule": "bp.elevated_single",
                "triggerData": {"systolic": sys, "diastolic": dia},
            })
            factors["bp_risk"] = 10

    return alerts
```

### 8.3 Risk Score Calculator

**`services/risk-engine/app/scoring/calculator.py`**
```python
# Weights are clinically derived and tunable
FACTOR_WEIGHTS = {
    "bp_risk":           1.0,   # BP is highest predictor
    "anemia_risk":       0.8,
    "followup_miss":     0.7,
    "fetal_risk":        0.9,
    "postpartum_risk":   0.8,
    "previous_losses":   0.3,
    "high_gravida":      0.2,
}

RISK_BANDS = [
    (81, 100, "critical"),
    (56, 80,  "high"),
    (31, 55,  "medium"),
    (0,  30,  "low"),
]

def calculate_risk_score(factors: dict, pregnancy) -> tuple:
    raw_score = 0

    for factor, weight in FACTOR_WEIGHTS.items():
        raw_score += factors.get(factor, 0) * weight

    # Base risk additions
    if pregnancy.previousLosses > 0:
        raw_score += pregnancy.previousLosses * 3
    if pregnancy.gravida and pregnancy.gravida >= 5:
        raw_score += 5

    # Clamp to 0-100
    score = min(100, max(0, raw_score))

    risk_level = "low"
    for low, high, level in RISK_BANDS:
        if low <= score <= high:
            risk_level = level
            break

    return round(score, 1), risk_level
```

### 8.4 Gemma LLM Integration

```python
# services/risk-engine/app/llm/gemma.py
import ollama
from .prompts import ALERT_TRANSLATION_PROMPT, VISIT_SUMMARY_PROMPT

def translate_alert_to_urdu(alert_message: str) -> str:
    """Translate a clinical alert into plain Urdu for LHWs."""
    response = ollama.chat(
        model='gemma2:2b',
        messages=[{
            'role': 'user',
            'content': ALERT_TRANSLATION_PROMPT.format(
                alert=alert_message,
                language="Urdu",
                audience="lady health worker with basic literacy"
            )
        }]
    )
    return response['message']['content']

def summarize_visit_history(visits: list, language: str = "en") -> str:
    """Summarize a patient's visit history in 3 sentences for a clinician."""
    visits_text = "\n".join([
        f"- {v['visitDate']}: BP {v.get('bpSystolic')}/{v.get('bpDiastolic')}, "
        f"Hb {v.get('hbLevel')}, Weight {v.get('weightKg')}kg"
        for v in visits[:5]
    ])
    response = ollama.chat(
        model='gemma2:2b',
        messages=[{
            'role': 'user',
            'content': VISIT_SUMMARY_PROMPT.format(
                visits=visits_text, language=language
            )
        }]
    )
    return response['message']['content']
```

**RULE: Gemma outputs are NEVER used to make clinical decisions. They are used only for translation, summarization, and explanation of decisions already made by the rules engine.**

---

## 9. Authentication & Authorization

### 9.1 Auth Flow

```
[User opens app]
      │
      ▼
[Cached JWT in IndexedDB?]
      │
  ┌───┴──────────────┐
  YES                NO
  │                  │
  ▼                  ▼
[Validate JWT]  [Show login screen]
  │                  │
  ├─ Valid →    [POST /auth/login]
  │   Load app       │
  │              [Returns JWT + refresh token]
  │                  │
  └──────────────────┘
                │
          [Store in IndexedDB]
          [NOT in localStorage]
          [NOT in cookies unless HttpOnly]
```

### 9.2 RBAC Middleware

```typescript
// apps/api/src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

type Permission = 'read:any' | 'read:own' | 'write:own' | 'write:any' | 'delete:any';

const ROLE_PERMISSIONS: Record<string, Record<string, Permission[]>> = {
  lhw: {
    patients:    ['read:own', 'write:own'],
    visits:      ['read:own', 'write:own'],
    alerts:      ['read:own'],
  },
  nurse: {
    patients:    ['read:any', 'write:any'],
    visits:      ['read:any', 'write:any'],
    alerts:      ['read:any', 'write:any'],
  },
  district_officer: {
    patients:    ['read:any'],
    visits:      ['read:any'],
    alerts:      ['read:any', 'write:any'],
    dashboard:   ['read:any'],
  },
  admin: {
    patients:    ['read:any', 'write:any', 'delete:any'],
    visits:      ['read:any', 'write:any', 'delete:any'],
    alerts:      ['read:any', 'write:any', 'delete:any'],
    workers:     ['read:any', 'write:any'],
    dashboard:   ['read:any'],
  },
};

export function requirePermission(resource: string, permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user.role;
    const allowed = ROLE_PERMISSIONS[role]?.[resource] ?? [];

    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // For 'own' permissions, filter by assigned patients
    if (permission.endsWith(':own')) {
      req.scopeToWorker = req.user.workerId;
    }

    next();
  };
}
```

---

## 10. Notification System

### 10.1 SMS Dispatch

```typescript
// apps/api/src/services/sms.service.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const smsService = {
  async send({ to, message }: { to: string; message: string }) {
    // Normalize phone number
    const normalized = normalizePhone(to);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalized,
    });

    // Log SMS sent (no message content stored — privacy)
    await prisma.smsLog.create({
      data: { to: normalized, sentAt: new Date(), status: 'sent' }
    });
  },
};

function normalizePhone(phone: string): string {
  // Handle Pakistani numbers: 0300 → +92300
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '+92' + cleaned.slice(1);
  if (cleaned.startsWith('92')) return '+' + cleaned;
  return '+' + cleaned;
}
```

### 10.2 Alert Message Templates

```typescript
// apps/api/src/services/templates.ts
export const SMS_TEMPLATES = {
  preeclampsia_risk: {
    en: (name: string) =>
      `ALERT: ${name} shows signs of preeclampsia risk. Please visit immediately.`,
    ur: (name: string) =>
      `خطرہ: ${name} میں پری-ایکلیمپسیا کی علامات ہیں۔ فوری ملیں۔`,
  },
  missed_followup: {
    en: (name: string, days: number) =>
      `${name} has missed her antenatal visit for ${days} days. Please follow up.`,
    ur: (name: string, days: number) =>
      `${name} نے ${days} دن سے وزٹ نہیں کیا۔ گھر جائیں۔`,
  },
  severe_anemia: {
    en: (name: string, hb: number) =>
      `URGENT: ${name} has severe anemia (Hb ${hb}). Refer to facility immediately.`,
    ur: (name: string, hb: number) =>
      `فوری: ${name} کا Hb ${hb} ہے — فوری اسپتال بھیجیں`,
  },
};
```

---

## 11. API Reference

### 11.1 Authentication

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/v1/auth/login` | `{ phone, password }` | `{ token, refreshToken, user }` |
| POST | `/api/v1/auth/refresh` | `{ refreshToken }` | `{ token }` |
| POST | `/api/v1/auth/logout` | — | `{ ok: true }` |

### 11.2 Patients

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/patients` | LHW+ | List patients (scoped by role) |
| POST | `/api/v1/patients` | LHW+ | Register new patient + pregnancy |
| GET | `/api/v1/patients/:id` | LHW+ | Get patient + full timeline |
| GET | `/api/v1/patients/search?q=` | LHW+ | Search by name or pregnancy ID |

### 11.3 Visits

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/visits` | LHW+ | Record a single visit |
| GET | `/api/v1/visits/:pregnancyId` | LHW+ | All visits for a pregnancy |

### 11.4 Sync (most important endpoint)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/sync` | All | Batch sync offline records |
| GET | `/api/v1/sync/status` | All | Queue status for this device |

**Request body:**
```json
{
  "items": [
    {
      "entityType": "visit",
      "entityId": "local-uuid-here",
      "payload": { "...visit fields..." },
      "createdOfflineAt": "2025-01-15T08:23:00Z"
    }
  ],
  "deviceId": "device-fingerprint",
  "workerId": "worker-uuid"
}
```

**Response:**
```json
{
  "results": [
    { "entityId": "local-uuid", "status": "synced", "serverId": "server-uuid" },
    { "entityId": "other-uuid", "status": "conflict" },
    { "entityId": "third-uuid", "status": "failed", "error": "Pregnancy not found" }
  ]
}
```

### 11.5 Alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/alerts` | Nurse+ | All unresolved alerts for my scope |
| PATCH | `/api/v1/alerts/:id/resolve` | Nurse+ | Mark alert resolved |
| GET | `/api/v1/alerts/critical` | Officer+ | All critical alerts in district |

### 11.6 Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/dashboard/overview` | Officer+ | Counts by risk level, trimester |
| GET | `/api/v1/dashboard/map` | Officer+ | Patient coords + risk level for map |
| GET | `/api/v1/dashboard/trends` | Officer+ | Weekly trends for BP, anemia, visits |
| GET | `/api/v1/dashboard/workers` | Officer+ | Per-worker performance stats |

### 11.7 Risk Engine (internal — not exposed to client)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/evaluate` | Evaluate risk for one pregnancy |
| POST | `/translate` | Translate alert to local language |
| POST | `/summarize` | Summarize visit history |

---

## 12. Environment & Configuration

### 12.1 `apps/api/.env`
```bash
# Database
DATABASE_URL="postgresql://materna:password@localhost:5432/maternalink"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="replace-with-256-bit-random-secret"
JWT_EXPIRES_IN="8h"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Risk Engine
RISK_ENGINE_URL="http://localhost:8001"

# SMS
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# App
NODE_ENV="production"
PORT=3001
ALLOWED_ORIGINS="https://app.maternalink.health"

# Encryption
ENCRYPTION_KEY="replace-with-32-byte-hex-key"
```

### 12.2 `services/risk-engine/.env`
```bash
# Ollama / Gemma
OLLAMA_HOST="http://localhost:11434"
GEMMA_MODEL="gemma2:2b"

# Feature flags
ENABLE_LLM_TRANSLATION=true
ENABLE_LLM_SUMMARY=true

PORT=8001
```

### 12.3 `apps/web/.env.local`
```bash
NEXT_PUBLIC_API_URL="https://api.maternalink.health/api/v1"
NEXT_PUBLIC_WS_URL="wss://api.maternalink.health"
NEXT_PUBLIC_DEFAULT_LOCALE="ur"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 13. Development Setup

### 13.1 Prerequisites

```bash
# Required versions
node --version    # ≥ 20.0.0
python --version  # ≥ 3.11
docker --version  # ≥ 24.0
ollama --version  # ≥ 0.1.0 (for local Gemma)
```

### 13.2 First-Time Setup

```bash
# 1. Clone
git clone https://github.com/your-org/maternalink.git
cd maternalink

# 2. Start infrastructure (Postgres, Redis)
docker-compose up -d postgres redis

# 3. Install all packages (monorepo)
npm install

# 4. Set up database
cd apps/api
cp .env.example .env         # fill in values
npx prisma migrate dev
npx prisma db seed           # seed test district, workers

# 5. Start backend
npm run dev                  # runs on :3001

# 6. Start frontend
cd ../web
cp .env.local.example .env.local
npm run dev                  # runs on :3000

# 7. Start risk engine
cd ../../services/risk-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# 8. Pull Gemma model (for LLM features)
ollama pull gemma2:2b
```

### 13.3 Docker Compose (full stack)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: maternalink
      POSTGRES_USER: materna
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    depends_on: [postgres, redis]
    env_file: ./apps/api/.env

  risk-engine:
    build: ./services/risk-engine
    ports:
      - "8001:8001"
    environment:
      - OLLAMA_HOST=http://ollama:11434

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    env_file: ./apps/web/.env.local

volumes:
  pgdata:
  ollama_data:
```

---

## 14. Deployment

### 14.1 Cloud Deployment (AWS)

```
Route 53 (DNS)
      │
      ▼
CloudFront CDN (Next.js static assets, PWA files)
      │
      ▼
Application Load Balancer
      │
      ├── /api/* ──────► ECS (Node.js API) ──► RDS PostgreSQL
      │                                    ──► ElastiCache Redis
      │
      ├── /risk/* ─────► ECS (Python FastAPI)
      │
      └── /* ──────────► ECS (Next.js)
```

### 14.2 On-Premise Deployment (for government data sovereignty)

```bash
# Single-server deployment (minimum viable for pilot)
# Requirements: Ubuntu 22.04, 8GB RAM, 100GB SSD

# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone and configure
git clone https://github.com/your-org/maternalink.git
cd maternalink
cp .env.production.example .env.production  # configure

# 3. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 4. Set up Nginx as reverse proxy
# 5. Set up SSL with certbot (Let's Encrypt)
# 6. Configure daily DB backups to external storage
```

### 14.3 Minimum Server Specs

| Environment | CPU | RAM | Storage | Notes |
|---|---|---|---|---|
| Development | 2 cores | 8 GB | 50 GB | Docker Desktop sufficient |
| Pilot (5,000 patients) | 4 cores | 16 GB | 200 GB | Single VPS or on-premise |
| District scale (50,000) | 8 cores | 32 GB | 500 GB | Start considering redundancy |
| National (500,000+) | Cluster | — | — | Auto-scaling required |

---

## 15. Testing Strategy

### 15.1 Test Layers

```
┌─────────────────────────────────────┐
│         E2E Tests (Playwright)       │  10%
│   Full user flows: LHW → sync →      │
│   dashboard alert                    │
├─────────────────────────────────────┤
│      Integration Tests (Jest)        │  20%
│   API routes + DB + sync processor   │
├─────────────────────────────────────┤
│         Unit Tests (Jest/Pytest)     │  70%
│   Risk rules · Sync logic · RBAC     │
└─────────────────────────────────────┘
```

### 15.2 Critical Tests — Risk Engine

```python
# services/risk-engine/tests/test_bp_rules.py

def test_severe_hypertension_triggers_critical():
    visits = [make_visit(bp_systolic=165, bp_diastolic=105)]
    alerts = check_bp_rules(visits, {})
    assert any(a["severity"] == "critical" for a in alerts)
    assert any(a["type"] == "severe_hypertension" for a in alerts)

def test_preeclampsia_requires_two_readings_in_one_week():
    visits = [
        make_visit(bp_systolic=145, bp_diastolic=92, date_offset_days=2),
        make_visit(bp_systolic=142, bp_diastolic=90, date_offset_days=5),
    ]
    alerts = check_bp_rules(visits, {})
    assert any(a["type"] == "preeclampsia_risk" for a in alerts)

def test_single_elevated_bp_is_only_medium():
    visits = [make_visit(bp_systolic=143, bp_diastolic=91)]
    alerts = check_bp_rules(visits, {})
    assert all(a["severity"] == "medium" for a in alerts)

def test_normal_bp_generates_no_alerts():
    visits = [make_visit(bp_systolic=118, bp_diastolic=76)]
    alerts = check_bp_rules(visits, {})
    assert len(alerts) == 0
```

### 15.3 Critical Tests — Sync Engine

```typescript
// apps/web/lib/sync/__tests__/processor.test.ts

describe('Sync Processor', () => {
  it('processes pending items and marks them synced', async () => {
    // setup: add 3 items to queue
    // mock: API returns success for all
    // assert: all 3 removed from queue, entities have serverId
  });

  it('marks conflicts without overwriting local data', async () => {
    // mock: API returns conflict for one item
    // assert: item has syncStatus=conflict, data unchanged
  });

  it('retries failed items up to MAX_RETRY_ATTEMPTS', async () => {
    // mock: API fails 5 times
    // assert: item not retried after 5 attempts
  });

  it('does not process same item twice concurrently', async () => {
    // trigger two sync runs simultaneously
    // assert: item only processed once
  });
});
```

---

## 16. Security Checklist

### Before Going Live — Non-Negotiable

- [ ] All patient PII encrypted at rest (AES-256)
- [ ] TLS 1.3 enforced — no HTTP allowed
- [ ] National IDs stored as SHA-256 hash only — plaintext never persists
- [ ] JWT tokens expire in 8 hours — refresh tokens in 30 days
- [ ] All API routes require authentication (no accidental public endpoints)
- [ ] Role-based access enforced server-side — never trust client role claims
- [ ] Audit log captures every record access with userId + timestamp
- [ ] Rate limiting on auth endpoints (max 10 attempts / 15 minutes)
- [ ] SQL injection impossible (Prisma parameterized queries — no raw SQL)
- [ ] XSS protection: Content-Security-Policy header configured
- [ ] Dependency audit: `npm audit` and `pip-audit` pass with no critical issues
- [ ] No patient data in application logs (log IDs not names)
- [ ] Database backups encrypted and tested for restore
- [ ] Sync endpoint validates workerId matches authenticated user
- [ ] LHWs can only read/write their assigned patients — verified server-side

---

*MaternaLink Software Specification v1.0*  
*Build the workflow infrastructure first. Prove impact. Then scale.*