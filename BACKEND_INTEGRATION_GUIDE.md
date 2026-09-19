# 🏥 Smart Hospital Backend Integration Guide
> **Repository:** `smart-hospital-hospital` (Hospital Operations & Clinical Portal)  
> **Target Audience:** Backend Developers & Portal Integration Engineers

---

## 1. System Architecture Overview

This portal is the **Hospital Portal** component of the multi-portal **SMART HOSPITAL QUEUE & NAVIGATION SYSTEM**.

```
                           ┌─────────────────────────────────────────┐
                           │            SHARED BACKEND               │
                           │   Supabase (PostgreSQL + Auth + RT)     │
                           └────────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 ▼                              ▼                              ▼
     ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
     │    HOSPITAL PORTAL    │      │    PATIENT PORTAL     │      │ PLATFORM ADMIN PORTAL │
     │  (THIS REPOSITORY)    │      │  (Companion Web/App)  │      │  (Super-Admin Portal) │
     │  - Doctors, OPD Queue │      │  - Booking, E-Token   │      │  - Multi-Hospital Mgt │
     │  - Care Journeys, Map │      │  - Wayfinding Map     │      │  - Subscriptions, RLS │
     └───────────────────────┘      └───────────────────────┘      └───────────────────────┘
```

> [!IMPORTANT]
> **Single Database Principle**: All 3 portals share the **same** Supabase PostgreSQL database project. Do **not** create a separate database or rewrite database tables for the other portals.

---

## 2. Quick Setup & Local Launch

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Note: If no Supabase credentials are provided, the portal automatically operates in offline/demo mode with comprehensive mock data, allowing full feature evaluation.)*

### Step 3: Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 3. Database Schema & Migrations

The complete PostgreSQL schema and seed data are located in the `supabase/` folder:

| File | Purpose |
| :--- | :--- |
| **`supabase/migrations/20260914000001_core_schema.sql`** | Core relational tables: `hospitals`, `departments`, `doctors`, `services`, `doctor_schedules`, `appointments`, `queue_entries`, `journeys`, `journey_steps`, `navigation_locations`, `notifications`, `audit_logs`. |
| **`supabase/migrations/20260914000002_rls_policies.sql`** | Multi-tenant Row-Level Security (RLS) policies by `hospital_id`, RBAC roles, and Supabase Realtime publication setup. |
| **`supabase/migrations/20260914000003_hospital_admin_schema.sql`** | Care journey templates (`journey_templates`, `journey_template_steps`) and audit logging functions. |
| **`supabase/seed.sql`** | Production-grade demo data for hospitals, doctors, departments, navigation nodes, and appointments. |

### How to apply to your Supabase Project:
1. Go to your Supabase Dashboard: **SQL Editor**.
2. Run the migration files in numerical order (`01`, `02`, `03`).
3. Run `seed.sql` to populate initial clinical departments, sample doctors, and floor wayfinding coordinates.

---

## 4. Multi-Tenant Tenancy & RLS

Every record is scoped to a specific hospital using `hospital_id`:
```sql
ALTER TABLE appointments ADD COLUMN hospital_id UUID REFERENCES hospitals(id);
ALTER TABLE queue_entries ADD COLUMN hospital_id UUID REFERENCES hospitals(id);
```
- **Hospital Admin**: Has read/write access to all records where `hospital_id = auth.jwt() ->> 'hospital_id'`.
- **Doctor**: Read/write access to their assigned appointments, schedules, and active consultation tokens.
- **Hospital Staff**: Read/write access to patient check-in (`/queue`) and live boards (`/queue/live`).
- **Patient Portal Integration**: Patients query appointments matching their `patient_id` or authenticated phone number.

---

## 5. Supabase Realtime Channels

The portal synchronizes data via Supabase Realtime with zero polling:

### Central Realtime Channel:
```typescript
const channel = supabase.channel(`hospital-${hospitalId}-realtime`);
```

### Realtime Tables Monitored:
1. **`queue_entries`**: On `INSERT` or `UPDATE`, invalidates queue lists, live TV board (`/queue/live`), and doctor waiting line.
2. **`appointments`**: On `INSERT` or `UPDATE`, syncs appointment records and doctor schedule slots.
3. **`doctors` & `doctor_schedules`**: On status change (`AVAILABLE`, `ON_BREAK`, `UNAVAILABLE`), updates doctor rosters and alerts staff to disruptions.
4. **`journeys` & `journey_steps`**: On step completion (`COMPLETED`), advances patients to the next station (e.g. Ultrasound, Lab).
5. **`notifications`**: On `INSERT`, triggers floating browser toasts and increments unread badge counts.

---

## 6. How to Connect Companion Portals

### Connecting the Patient Portal
1. Use the same Supabase project URL and anon key.
2. When a patient books an appointment, insert into the shared `appointments` table:
   - Set `hospital_id`, `department_id`, `doctor_id`, `appointment_date`, `expected_start`.
3. When staff checks the patient in via this Hospital Portal, a `queue_entries` row is created. The Patient Portal can listen to `queue_entries` updates for `queue_reference` (e.g. `CARD-201`), position, and `estimated_wait`.
4. Indoor Wayfinding: Query `navigation_locations` for building, floor, room coordinates `(x, y)` to draw turn-by-turn navigation paths.

### Connecting the Platform Admin Portal
1. Platform Super-Admins manage the `hospitals` table.
2. Create or onboard new hospitals and issue admin credentials.
3. Query `audit_logs` and operational analytics across hospitals.

---

## 7. Key Service Layer Reference

All backend API logic is cleanly decoupled in `src/services/`:
- `src/services/api.ts` — Comprehensive Supabase query layer with fallback data store.
- `src/services/queueService.ts` — Check-in, position assignment, calling patients.
- `src/services/journeyService.ts` — Step progression and template configuration.
- `src/services/navigationService.ts` — Digital twin building/block/floor hierarchy.
- `src/services/analyticsService.ts` — Aggregates 8 KPIs and 7 Recharts time series.
- `src/realtime/realtimeManager.ts` — WebSocket connection lifecycle and tab bus.
