
National Maternal Intelligence Infrastructure (NMII)
MVP + System Design Document (Web-Based, Offline-First, AI-Assisted)

1. Executive Summary
NMII is a web-based, offline-first maternal healthcare intelligence system designed to:
Continuously track pregnancies end-to-end
Collect structured + voice-based maternal health data
Detect maternal risk early using hybrid AI + clinical rules
Support rural health workers in low-connectivity environments
Provide government-level population health intelligence
Reduce preventable maternal deaths through early intervention
It is NOT:
a pregnancy advice app
a chatbot
a consumer health tracker
It is:
a maternal healthcare operating system for frontline + national health infrastructure

2. Core Problem Statement
Maternal mortality persists due to:
System Failures
Fragmented patient records across clinics/hospitals
No longitudinal pregnancy tracking
Missing early warning detection systems
Lack of rural digital infrastructure
Poor follow-up enforcement
Delayed escalation during emergencies
Data Failures
Paper-based or siloed records
No unified maternal identity
No structured symptom tracking
No predictive analytics
Operational Failures
No coordination between:
lady health workers
hospitals
labs
government systems
No real-time risk visibility

3. Product Vision
One-line vision:
“Every pregnancy is tracked, predicted, and protected in real time through a unified maternal intelligence network.”

4. Target Users
Primary Users
Pregnant women (low literacy included)
Community health workers (CHWs)
Midwives
Rural clinic staff
Secondary Users
Doctors / gynecologists
Hospitals
Government health departments
NGOs

5. System Overview (High-Level Architecture)
Core Layers
1. Client Layer (Web App - Offline First)
Progressive Web App (PWA)
Works offline in rural environments
Syncs when internet available
2. Data Layer
Local storage (IndexedDB)
Cloud database (PostgreSQL / Supabase / Firebase alternative)
Event-based sync system
3. AI Layer
Risk scoring engine (rule-based + ML hybrid)
Gemma-based LLM for language + explanation
Symptom extraction pipeline
4. Backend Layer
API server (Node.js / FastAPI)
Authentication + role system
Sync + conflict resolution system
5. Analytics Layer
Government dashboard
Population health monitoring
Risk heatmaps

6. Core Modules (MVP Scope)

MODULE 1 — Maternal Identity System
Purpose
Create a unified digital pregnancy record
Features
Unique Pregnancy ID (linked to national ID optionally)
Timeline tracking:
trimester stage
visit history
risk history
Medical profile:
blood pressure
hemoglobin
glucose
weight
symptoms
Pregnancy outcomes history
Data Model (Simplified)
MotherProfile {
 id,
 name,
 age,
 location,
 pregnancies: [
   {
     pregnancyId,
     startDate,
     currentTrimester,
     riskLevel,
     visits[],
     vitals[],
     alerts[]
   }
 ]
}

MODULE 2 — Offline Data Collection System
Purpose
Enable rural data entry without internet.
Features
Fully offline web app (PWA)
Local database (IndexedDB)
Auto-sync when internet returns
Form-based + voice-based input
Data Capture Types
1. Structured Forms
BP
Hb level
symptoms checklist
visit notes
2. Voice Input (Critical Feature)
“She has headache and swelling”
Converts speech → structured medical fields
3. Image Upload (future MVP+)
reports
prescriptions
ultrasound scans

Voice-to-Data Pipeline
Browser captures audio
Web Speech API / offline STT model
Text normalization
Symptom extraction model
Structured JSON conversion
Example:
Input voice:
“Patient has severe headache and blurred vision”
Output:
{
 symptoms: ["headache", "blurred vision"],
 risk_flags: ["possible preeclampsia"]
}

MODULE 3 — AI Risk Detection Engine
Purpose
Predict maternal complications early.

Hybrid Architecture
A. Rule-Based Engine (Critical Medical Safety Layer)
Examples:
BP > 140/90 → hypertension flag
Hb < 10 → anemia risk
swelling + headache → preeclampsia risk
no visit for 30+ days → follow-up alert

B. ML/AI Layer
Uses:
time-series vitals
symptom patterns
historical outcomes
Outputs:
risk probability score (0–100)
risk category:
Low
Medium
High
Emergency

C. LLM Layer (Gemma)
Used for:
symptom explanation
multilingual translation
summarization for doctors
worker guidance
NOT used for diagnosis.

Risk Output Example
{
 riskLevel: "HIGH",
 alerts: [
   "Possible preeclampsia",
   "Immediate hospital referral recommended"
 ],
 confidence: 0.87
}

MODULE 4 — Local Language Health Assistant
Purpose
Bridge literacy + language gap.
Features
Urdu / Sindhi / Punjabi / Pashto support
Voice interaction
Simple explanations

Capabilities
For patients:
“Is this symptom dangerous?”
“When should I go to hospital?”
medication reminders
For health workers:
“Summarize this patient”
“What risks are present?”

Architecture
User voice/text → LLM → structured response → safety filtered → output voice/text

MODULE 5 — Follow-Up & Continuity System
Purpose
Prevent missed care.
Features
Automated reminders
Visit scheduling
missed appointment alerts
escalation to supervisor if ignored

Example Logic
If:
no visit in 21 days AND high risk
Then:
alert CHW
escalate to clinic
notify dashboard

MODULE 6 — Emergency Escalation System
Purpose
Prevent delayed maternal emergency response
Flow
High-risk detected
System triggers alert
Local health worker notified
Hospital pre-alert generated
Transport suggestion triggered

MODULE 7 — Government Analytics Dashboard
Purpose
Population-level intelligence

Features
Maternal mortality risk heatmaps
District risk scores
anemia prevalence tracking
clinic performance metrics
emergency response time tracking

Key Insights Generated
“Region A has 3x higher preeclampsia risk”
“Clinic X missing follow-ups 40% cases”
“Anemia rising trend in district Y”

7. Data Flow Architecture
User/Worker Input (Voice/Form)
       ↓
Offline Local DB (IndexedDB)
       ↓
Sync Engine (when online)
       ↓
Backend API
       ↓
PostgreSQL Database
       ↓
AI Risk Engine
       ↓
Alerts + Dashboard + Reports

8. Offline-First System Design
Technology Choice
PWA (Progressive Web App)
Service Workers
IndexedDB local storage
Background sync API
Behavior
Works without internet
Queues all data locally
Syncs automatically later
Conflict resolution via timestamps

9. Security & Privacy Model
Requirements
End-to-end encryption for sensitive data
Role-based access control:
patient
health worker
doctor
admin
Compliance Principles
data minimization
consent-based access
audit logs for all changes

10. Technical Stack (Recommended MVP)
Frontend
React / Next.js
PWA support
IndexedDB wrapper (Dexie.js)
Backend
FastAPI or Node.js
PostgreSQL
AI Layer
Gemma model (self-hosted or API wrapper)
Python ML service (risk engine)
Infrastructure
Dockerized services
cloud deploy (AWS / GCP / local government servers)

11. MVP Scope (STRICT)
Build ONLY:
Must Have
Maternal identity system
Offline data collection
Sync engine
Rule-based risk detection
Basic dashboard
Voice input
Not in MVP:
full national scale rollout
advanced ML training
hospital integration APIs
imaging AI

12. Clinical Logic Design (Example)
Preeclampsia Detection Rule
IF:
BP > 140/90
 AND
headache OR blurred vision OR swelling
THEN:
risk = HIGH
trigger alert
recommend hospital referral

Anemia Rule
IF Hb < 10:
moderate risk
 IF Hb < 7:
emergency risk

13. System Constraints
low bandwidth environments
low-end Android devices
intermittent connectivity
multilingual input
non-technical users

14. Pilot Deployment Strategy
Step 1
1 district
1 hospital
20–50 health workers
Step 2
500–5000 pregnancies tracked
Step 3
Measure:
risk detection accuracy
maternal follow-up improvement
emergency reduction

15. Key Success Metrics
% early risk detection
reduction in missed prenatal visits
reduction in emergency cases
follow-up compliance rate
system adoption rate by workers

16. Final System Philosophy
This system is NOT built around AI.
It is built around:
“continuous maternal health intelligence across fragmented healthcare systems.”
AI is only a supporting layer.
The real product is:
infrastructure
continuity
coordination
early detection

