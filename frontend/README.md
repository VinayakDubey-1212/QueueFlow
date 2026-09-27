# QueueFlow — Frontend

A standalone React + TypeScript + Tailwind frontend for the QueueFlow
appointment/queue platform. Runs entirely on mock, in-memory data (via
Zustand) — **no backend or database required**. Every action (joining a
queue, calling the next customer, completing service, booking an
appointment) updates shared client-side state so the whole demo flow works
end to end.

## Design

- **Palette**: deep pine-teal ink (`#0D1F1B`) + departure-board amber
  (`#FFB300`) — built around the live queue board itself rather than a
  generic SaaS look.
- **Type**: Space Grotesk for UI/headlines, IBM Plex Mono for tokens,
  timestamps, and stat figures (numbers should feel like data, not prose).
- **Screens**: landing → organization discovery → branch/service selection →
  join queue or book appointment → live queue tracking screen → staff
  console (call/start/complete/skip/recall) → admin dashboard (metrics +
  charts) → branches/services/staff/counters management → audit log →
  super-admin platform view.

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Go to **Sign in** and pick a role
(Customer, Staff, Org Admin, Super Admin) — no password needed, this is a
frontend-only demo.

## Try the full flow

1. Sign in as **Customer** → Join a queue → pick CityCare Clinic → Andheri →
   General Consultation → **Join virtual queue now**. Watch the live token
   screen.
2. Open a second tab, sign in as **Staff** → **Call next customer** → **Start
   service** → **Complete service**. Switch back to the customer tab — the
   queue position updates (poll-simulated "live" refresh every 5s, standing
   in for the WebSocket push the real backend will do).
3. Sign in as **Org Admin** to see the dashboard, branch/service management,
   counters, and the audit log recording everything you just did.

## Structure

```
src/
  types/        shared TypeScript types
  lib/mockData.ts    seed data (mirrors backend/prisma/seed.ts)
  store/useAppStore.ts   Zustand store — simulates the backend's queue state
                          machine (same transition rules as docs/queue-logic.md)
  components/    shared UI (buttons, badges), ConsoleShell (staff/admin nav), charts
  pages/         one file per screen
```

## Wiring to the real backend later

Every mutation currently goes through `useAppStore` (`joinQueue`, `callNext`,
`startService`, etc.). Swapping in the real API means replacing those
function bodies with `fetch`/axios calls to the endpoints in
`../queueflow-phase1/docs/api.md`, and replacing the 5-second poll in
`LiveQueuePage` with a Socket.IO subscription — the state shape and UI
don't need to change.
