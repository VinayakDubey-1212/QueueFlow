# QueueFlow

A queue and appointment management app for places like clinics, banks, and
government offices — instead of standing in a physical line, you get a
token, a live position, and an honest wait estimate that updates as the
queue moves.

**Live demo flow:** sign in as a customer → join a queue → open a second
browser tab, sign in as staff → call the next customer → watch the
customer's screen update.

## How it's built

```
queueflow-project/
  backend/     Node.js + Express + TypeScript + SQLite (via Prisma)
  frontend/    React + TypeScript + Tailwind CSS
```

**Why SQLite:** it's a single file — no database server to install, no
password to configure. `npx prisma migrate dev` creates `dev.db` and you're
done.

**Why this split:** the backend owns all the actual logic — who's in the
queue, what order they get called in, generating unique tokens, calculating
wait times. The frontend just displays that state and sends actions
(join, call next, complete) to the backend. That's the same shape a real
production app would use, just without the extra layers (multi-tenant
orgs, complex role hierarchies) that would make a demo project harder to
read.

## Run it

You need two terminals — one for the backend, one for the frontend.

**Terminal 1 — backend:**

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

This starts the API on `http://localhost:4000` and seeds demo data — one
organization (CityCare Clinic), two branches, three services, four
counters, and four login accounts:

| Role | Email | Password |
|---|---|---|
| Customer | customer@example.com | Customer@123 |
| Staff (Counter 1) | staff1@citycare.dev | Staff@123 |
| Staff (Counter 2) | staff2@citycare.dev | Staff@123 |
| Admin | admin@citycare.dev | Admin@123 |

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The login page has one-click buttons for each
demo account above — no typing needed.

## What each piece actually does

**Backend (`backend/src/`)**
- `db.ts` — the one shared database connection
- `auth.ts` — password hashing, JWT tokens, and the middleware that checks
  who's logged in and what role they have
- `audit.ts` — a one-line helper that logs actions (who did what, when)
- `routes/auth.ts` — register, login, get current user
- `routes/catalog.ts` — organizations, branches, services, counters
- `routes/queue.ts` — the core feature: join a queue, get live status, and
  the staff actions (call next, start, complete, skip, recall). This file
  also has the "state machine" — a table of which status can change into
  which other status, so a completed entry can never accidentally be
  reopened, for example.
- `routes/appointments.ts` — book and cancel appointments
- `routes/admin.ts` — dashboard numbers and the audit log
- `prisma/schema.prisma` — the database tables and how they relate
- `prisma/seed.ts` — fills the database with demo data

**Frontend (`frontend/src/`)**
- `lib/api.ts` — every call to the backend goes through this one file
- `store/useSession.ts` — remembers who's logged in (using a real JWT from
  the backend, saved in the browser's local storage)
- `pages/` — one file per screen (landing page, login, browse
  organizations, live queue tracker, staff console, admin dashboard, etc.)
- `components/` — small reusable pieces (buttons, status badges, the
  navigation bars for the public site vs. the staff/admin console)

## How the queue actually works

1. A customer picks an organization, branch, and service, then joins the
   queue. The backend generates a token like `A-104` — this happens on the
   server, inside a database transaction, so two people joining at the
   exact same moment can never get the same token.
2. The customer's screen polls the backend every 5 seconds for their live
   position, people ahead, and estimated wait time.
3. A staff member clicks "Call next" — the backend picks the
   longest-waiting person (higher-priority entries go first), marks them as
   `CALLED`, and assigns them to that staff member's counter.
4. Staff clicks "Start service", then "Complete service" when done. Every
   one of these actions is written to the audit log.

## Known limitations (worth knowing before a demo)

- Single organization only — I simplified away the "many separate
  organizations with strict data isolation" complexity to keep the code
  readable. The database schema still models organizations properly; there
  just isn't a UI for managing more than one.
- The "add branch / add service" buttons on the admin screen aren't wired
  up — everything else on that page reads real data.
- Live updates use polling (checking every few seconds) instead of a
  WebSocket push. Simpler to reason about, at the cost of a small delay.
- No automated tests yet.
