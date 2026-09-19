# Smart Hospital Queue & Navigation System — Hospital Portal

> **Repository:** `smart-hospital-hospital`  
> Dedicated clinical & operations web portal for hospital personnel: **Hospital Admins**, **Hospital Staff**, and **Doctors**.

---

## 1. Overview & Architecture

The **Hospital Portal** is the central command center of the *Smart Hospital Queue & Navigation System*. It coordinates outpatient department (OPD) queue dispatch, live kiosk boards, doctor duty rosters, clinical service catalogs, geospatial wayfinding nodes, care journey routing, and real-time operations without full-page reloads.

### Tech Stack
- **Framework**: React (v18) + Vite + Strict TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **State & Server Cache**: TanStack Query (v5)
- **Routing**: React Router (v6) with Role-Based Route Protection
- **Shared Backend & DB**: Supabase (PostgreSQL 15, Supabase Auth, Supabase Realtime, RLS)
- **Visuals & Charts**: Recharts & Lucide React
- **Audio Feedback**: Web Audio API synthesized hospital chime

---

## 2. Directory Structure

```
smart-hospital-hospital/
├── public/
│   └── hospital-icon.svg
├── supabase/
│   ├── migrations/
│   │   ├── 20260914000001_core_schema.sql  # 13 core tables, UUID keys, FKs, indexes
│   │   └── 20260914000002_rls_policies.sql # Tenant isolation, RBAC, Realtime publication
│   └── seed.sql                            # Production-grade seed & demo dataset
├── src/
│   ├── components/
│   │   ├── ui/                             # Button, Input, Select, Card, Table, Modal, Badge, Alert
│   │   └── layout/                         # TopHeader, Sidebar, RoleBadge, RealtimeIndicator
│   ├── pages/                              # All 16 required route views
│   │   ├── Auth/                           # Login & Quick Role Switcher
│   │   ├── Dashboard/                      # Live OPD KPI Command Center
│   │   ├── Queue/                          # Queue Manager & Live TV Board (/queue/live)
│   │   ├── Appointments/                   # Appointment directory & detail view
│   │   ├── Doctors/                        # Doctor duty directory & status toggles
│   │   ├── Departments/                    # Department listings & details
│   │   ├── Services/                       # Clinical procedures & diagnostics
│   │   ├── Navigation/                     # Geospatial floor nodes & wayfinding
│   │   ├── JourneyConfig/                  # Care journey sequential templates
│   │   ├── Analytics/                      # Throughput metrics & bottleneck analysis
│   │   ├── Notifications/                  # Realtime alerts & audit logs
│   │   ├── Profile/                        # Staff credentials & facility info
│   │   └── Settings/                       # Operating hours & queue thresholds
│   ├── layouts/                            # HospitalLayout & AuthLayout
│   ├── routes/                             # AppRoutes & ProtectedRoute (RBAC)
│   ├── services/                           # Centralized API & Supabase services
│   ├── hooks/                              # useAuth, useRealtime, useQueue, useDashboardStats, useSound
│   ├── types/                              # database.types, auth.types, queue.types
│   ├── utils/                              # cn, formatters, constants
│   ├── lib/                                # supabaseClient, utils
│   ├── contexts/                           # AuthContext, RealtimeContext
│   ├── features/                           # DepartmentWorkloadChart
│   ├── websocket/                          # realtimeManager (channel multiplexer)
│   └── query/                              # queryClient & queryKeys
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Set your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Security Rule**: Never expose your Supabase `service_role` secret key in the frontend. Only use the public `anon` key.

*Note*: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are left blank, the application automatically runs in **Offline / Local Seed Demo Mode** with high-fidelity mock data and simulated local state changes so the entire portal can be tested immediately without network dependencies.

---

## 4. Supabase Setup & Database Migration

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the schema migrations in exact order:
   - **Step 1**: Execute `supabase/migrations/20260914000001_core_schema.sql` (Creates all 13 tables, UUID primary keys, indexes, triggers).
   - **Step 2**: Execute `supabase/migrations/20260914000002_rls_policies.sql` (Enables Row Level Security and adds tables to `supabase_realtime` publication).
   - **Step 3**: Execute `supabase/seed.sql` (Seeds initial hospitals, departments, doctors, services, appointments, queue tokens, journeys, and wayfinding locations).

---

## 5. User Roles & Access Control Matrix

The Hospital Portal strictly implements three authenticated roles:

| Role | Permissions | Available Routes |
| :--- | :--- | :--- |
| **`HOSPITAL_ADMIN`** | Full access to hospital settings, doctor rosters, departments, service catalog, journey configs, analytics, and audit logs. | All routes (`/dashboard`, `/queue`, `/appointments`, `/doctors`, `/departments`, `/services`, `/navigation`, `/journey-config`, `/analytics`, `/notifications`, `/profile`, `/settings`) |
| **`HOSPITAL_STAFF`** | Manages OPD queue, calls next patients, updates care journey steps, views appointments and doctors. | `/dashboard`, `/queue`, `/queue/live`, `/appointments`, `/doctors`, `/departments`, `/services`, `/navigation`, `/journey-config`, `/notifications`, `/profile` |
| **`DOCTOR`** | Manages assigned consultation queue, starts/completes consultations, toggles own duty status (`AVAILABLE`, `ON_BREAK`, `OFFLINE`). | `/dashboard`, `/queue`, `/queue/live`, `/appointments`, `/doctors`, `/departments`, `/services`, `/navigation`, `/notifications`, `/profile` |

---

## 6. Realtime Architecture

The application connects to Supabase Realtime using WebSocket channels multiplexed inside `src/websocket/realtimeManager.ts`:

- Subscribed tables:
  - `appointments`
  - `queue_entries`
  - `doctors`
  - `doctor_schedules`
  - `journeys`
  - `notifications`
- When a database change occurs:
  1. WebSocket event is received.
  2. Targeted TanStack Query cache keys (e.g. `['queue', hospitalId]`, `['dashboard', stats]`) are automatically invalidated.
  3. UI updates reactively without any page reload.
  4. Banner toasts appear notifying staff of token calls.
  5. The Live TV board plays a Web Audio two-tone chime when a patient token is called.
- Connection state indicator in the top header continuously displays:
  - 🟢 `LIVE` (Subscribed and synchronized)
  - 🟡 `RECONNECTING` (Channel retry)
  - ⚪ `OFFLINE` (Disconnected or demo mode)

---

## 7. Row Level Security (RLS) Rules

- **Multi-Tenant Hospital Isolation**: Every profile belongs to a `hospital_id`. RLS policies evaluate `hospital_id = public.current_user_hospital_id()`. A staff member from Hospital A can **never** query or mutate appointments, doctors, or queues belonging to Hospital B.
- **Doctor Security**: Doctors can view general hospital queues but can only modify queue entries assigned to their department/doctor ID.
- **Client Trust Zero**: The database does not trust client-sent role, queue position, or hospital IDs; all authorization is resolved server-side from `auth.uid()` and session JWT claims.

---

## 8. Installation & Running Locally

```bash
# 1. Navigate to the project directory
cd smart-hospital-hospital

# 2. Install dependencies (Node 18+)
npm install

# 3. Start local development server
npm run dev

# 4. Type check with strict TypeScript
npm run type-check

# 5. Build for production
npm run build
```

---

## 9. Testing & Demo Credentials

When running in demo mode or initial testing, you can use the 1-click role switcher on the login page or top header:
- **Hospital Admin**: `admin@citygeneral.health` (Eleanor Vance)
- **Doctor (OB/GYN)**: `priya.sharma@citygeneral.health` (Dr. Priya Sharma)
- **Hospital Staff**: `staff.marcus@citygeneral.health` (Marcus Chen)
