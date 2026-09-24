# GovInfra Gujarat — Frontend

React 19 + TypeScript + Vite frontend for the **GovInfra Gujarat** Government
Infrastructure Lifecycle & Workflow Management Platform. Consumes an existing
FastAPI backend at `/api/v1` — no backend code lives in this repo.

Core workflow modeled by the UI:

```
Project → Progress → Inspection → RA Bill → File Tracking → Engineer → Finance → Treasury → Payment
```

The hero screen is **File Tracking** (`/workflow`): a Kanban board of government
files moving through `Submitted → Engineer Review → Finance Review → Treasury → Paid`,
with a drawer showing the full audit timeline (officer, department, action,
timestamp, remarks) and Approve/Return actions.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · shadcn-style components (Radix
primitives) · React Router · TanStack Query · Axios · React Hook Form + Zod ·
Recharts · Lucide · Leaflet.

## Getting started

```bash
npm install
cp .env.example .env   # adjust if your backend isn't on localhost:8000
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api/*` to
`VITE_PROXY_TARGET` (default `http://localhost:8000`), so the FastAPI backend
needs no CORS configuration for local development.

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL the app calls for all API requests. | `/api/v1` |
| `VITE_PROXY_TARGET` | Dev-only: where Vite's proxy forwards `/api/*`. | `http://localhost:8000` |
| `VITE_AUTH_LOGIN_MODE` | `json` posts `{email, password}`; `form` posts an OAuth2 `x-www-form-urlencoded` body (`username`/`password`) — match whichever your FastAPI `/auth/login` route expects. | `json` |

In production, point `VITE_API_BASE_URL` at your deployed API's full URL (or
keep it relative and put FastAPI behind the same origin/reverse proxy).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check, then build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run typecheck` — type-check only

## Folder structure

```
src/
  components/
    layout/      # AppShell, AppSidebar, TopNavbar, NotificationBell, UserMenu, Breadcrumb, ProtectedRoute
    ui/           # Button, Card, Input, Table, Tabs, Sheet, Dialog, DropdownMenu, etc. (shadcn-style, Radix-based)
    tables/       # DataTable, StatusBadge, SearchBar, EmptyState, ConfirmDialog, loading skeletons
    workflow/     # WorkflowCard (Kanban card), Timeline (vertical audit trail)
    charts/       # StatCard, ChartCard, MapCard (+ lazy-loaded Leaflet map)
  pages/
    auth/         # Login
    dashboard/    # Role-specific dashboard (Admin/Contractor/Engineer/Finance/Treasury)
    projects/     # List, Create, Detail (tabs: Overview/Progress/Inspection/Files/Bills)
    progress/     # Contractor progress submission + history
    inspections/  # Engineer inspection form + PASS/FAIL history
    billing/      # RA bill creation (auto net amount) + status tracking
    workflow/     # File Tracking Kanban + drawer (hero screen)
    treasury/     # Payment queue + release action
    notifications/# Full notification center
    analytics/    # Portfolio-wide charts
  services/       # Axios service per resource (auth, projects, progress, inspections, billing, workflow, treasury, dashboard, notifications)
  hooks/          # TanStack Query hooks per resource
  contexts/       # AuthContext (JWT session, persisted in localStorage)
  types/          # TypeScript interfaces matching the backend contract
  routes/         # Router config + breadcrumb hook
```

## Authentication

- JWT bearer token, stored in `localStorage` and attached to every request
  via an Axios request interceptor.
- A response interceptor clears the session and redirects to `/login` on any
  `401` (except the login call itself).
- Session is restored on reload by calling `GET /auth/me` with the stored
  token.
- Unauthorized routes (wrong role) redirect to the dashboard.

## Demo accounts

The login screen has one-tap buttons to fill these in (they assume your
backend seeds matching users):

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@demo.com | admin123 |
| Contractor | contractor@demo.com | contractor123 |
| Engineer | engineer@demo.com | engineer123 |
| Finance | finance@demo.com | finance123 |
| Treasury | treasury@demo.com | treasury123 |

## API contract

Base URL `/api/v1`, JWT bearer auth (`Authorization: Bearer <token>`).
Endpoints used: `/auth/login`, `/auth/me`, `/projects`, `/contractors`,
`/progress`, `/inspections`, `/ra-bills`, `/workflow/files`,
`/workflow/files/:id/history`, `/workflow/files/:id/approve`,
`/workflow/files/:id/return`, `/payments`, `/payments/:id/release`,
`/dashboard`, `/notifications`. List endpoints accept either a bare JSON
array or a paginated envelope (`{items: [...]}` / `{results: [...]}` /
`{data: [...]}`) — `unwrapList()` in `services/api.ts` normalizes both.

## Deployment (Vercel)

1. Push this project to a Git repo and import it in Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist`.
3. Set `VITE_API_BASE_URL` (and `VITE_AUTH_LOGIN_MODE` if needed) in the
   Vercel project's Environment Variables.
4. `vercel.json` already rewrites all non-`/api` paths to `index.html` so
   client-side routing works on refresh/deep links.

If your FastAPI backend is deployed separately, either set
`VITE_API_BASE_URL` to its full URL, or add a Vercel rewrite/proxy for
`/api/*` to that backend so the SPA can call it same-origin.
