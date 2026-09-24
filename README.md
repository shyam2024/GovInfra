# GovInfra

A full-stack Government Infrastructure Lifecycle & Workflow Management Platform built to digitally track a public infrastructure project from creation all the way to treasury payment, with full transparency into which department currently holds a file.

```
Project → Progress → Inspection → RA Bill → Workflow File → Engineer → Finance → Treasury → Payment
```

The centerpiece is **File Tracking**: a Kanban board of government files moving through `Submitted → Engineer Review → Finance Review → Treasury → Paid`, backed by an immutable audit timeline (officer, department, action, timestamp, remarks) on every file.

This is a monorepo with two independent halves:

```
.
├── frontend/   React 19 + TypeScript SPA
└── backend/    FastAPI + PostgreSQL REST API
```

They're built as a matched pair every endpoint, field name, and enum value on the backend mirrors the frontend's TypeScript types exactly, so they plug into each other with zero glue code.

## Tech stack

| | |
| --- | --- |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS · shadcn-style components (Radix) · React Router · TanStack Query · Axios · React Hook Form + Zod · Recharts · Leaflet |
| **Backend** | Python 3.13 · FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL (asyncpg) · Pydantic v2 · JWT (python-jose) · bcrypt · Alembic |

## Features

- **JWT auth with role-based access control** — five roles (Admin, Contractor, Engineer, Finance, Treasury), each with its own dashboard and permissions
- **Project lifecycle** — create/track projects with budget, location (map view), contractor assignment, and live progress %
- **Progress & inspections** — contractors log site progress; engineers record PASS/FAIL inspections
- **RA Bills** — gross amount, GST, retention, with net amount auto-calculated
- **Workflow engine** — submitting a bill creates a workflow file that moves through Engineer → Finance → Treasury review, with return-for-revision support and a full history trail
- **Treasury & payments** — payment queue with a one-click release flow
- **Role-specific dashboards** — live stats per role, plus admin-only charts (project status, workflow distribution, monthly payments, budget utilization)
- **Notifications** — in-app notifications generated on bill submission, approval, return, and payment release

## Project structure

```
frontend/
  src/
    components/   layout, ui primitives, tables, workflow (Kanban card, Timeline), charts
    pages/        auth, dashboard, projects, progress, inspections, billing, workflow, treasury, notifications, analytics
    services/     one Axios module per API resource
    hooks/        TanStack Query hooks per resource
    contexts/     AuthContext (JWT session)
    types/        TypeScript interfaces — the source of truth for the API contract
backend/
  app/
    core/         config, async DB session, JWT/bcrypt security, cross-DB UUID type
    models/       SQLAlchemy 2.0 models, one file per entity
    schemas/      Pydantic request/response models (field names match the frontend's types)
    services/     business logic, incl. the workflow engine
    api/v1/       route handlers, one router per resource
  alembic/        versioned DB migrations
  seed/seed.py    demo dataset, built by calling the real service layer
```

## Getting started

You'll need **Node 20+**, **Python 3.13**, and a **PostgreSQL** database (Backend can also run against SQLite for a quick local check, see below).

### 1. Backend

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string
# (postgresql+asyncpg://user:pass@host/db?ssl=require) and JWT_SECRET_KEY
# to a long random value

alembic upgrade head              # create the schema
python seed/seed.py               # demo users, projects, bills, etc.

uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

<details>
<summary>Running the backend against SQLite instead (no Postgres needed)</summary>

```bash
export DATABASE_URL=sqlite+aiosqlite:///./dev.db
python scripts/create_db.py
python seed/seed.py
uvicorn app.main:app --reload --port 8000
```
</details>

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # defaults already point at localhost:8000
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:8000`, so no CORS setup is needed locally.

### Demo logins

Seeded by `backend/seed/seed.py`, and available as one-tap buttons on the login screen:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@demo.com | admin123 |
| Contractor | contractor@demo.com | contractor123 |
| Engineer | engineer@demo.com | engineer123 |
| Finance | finance@demo.com | finance123 |
| Treasury | treasury@demo.com | treasury123 |

## How the pieces connect

- Frontend calls `VITE_API_BASE_URL` (default `/api/v1`); every backend route is mounted under `/api/v1`.
- Login POSTs `{email, password}` as JSON to `/auth/login` and stores the returned `access_token`.

## Workflow engine

Stage sequence: `SUBMITTED → ENGINEER_REVIEW → FINANCE_REVIEW → TREASURY → PAID`. Only the matching role (or Admin) can act on a file at a given stage:

| Stage | Who can approve/return |
| --- | --- |
| Submitted | Admin only |
| Engineer Review | Engineer or Admin |
| Finance Review | Finance or Admin |
| Treasury | Treasury or Admin |

- **Approve** advances one stage. Reaching *Treasury* creates a payment ready for release; approving *at* Treasury releases it immediately.
- **Return** sends a file back to *Submitted* for revision (remarks required).
- Every transition is appended to an immutable history log — nothing is ever overwritten — which is what powers the file's audit timeline in the UI.

## Deployment notes

> **Note:** This project is shared as a proof-of-concept / reference implementation for a government infrastructure workflow platform a solid foundation designed to be configured and extended to match the specific regulatory, compliance, and departmental requirements of the implementing government body, rather than a one-size-fits-all finished product. It's released under the MIT License, so any government agency, contractor, or developer is free to use, modify, and adapt it to their own needs subject to the terms of that license.
