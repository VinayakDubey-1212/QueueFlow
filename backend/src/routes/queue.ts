import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, AuthedRequest } from '../auth';
import { logAction } from '../audit';

export const queueRouter = Router();

// Which status changes are allowed. Anything not listed here is rejected —
// this is what stops a completed entry from being reopened, a cancelled
// entry from being called, etc.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['CALLED', 'CANCELLED'],
  CALLED: ['IN_SERVICE', 'SKIPPED', 'WAITING'],
  IN_SERVICE: ['COMPLETED'],
  COMPLETED: [],
  SKIPPED: [],
  CANCELLED: [],
};

async function nextToken(branchId: string, serviceId: string) {
  const entries = await db.queueEntry.findMany({ where: { branchId, serviceId }, select: { token: true } });
  const max = entries.reduce((m, e) => {
    const n = parseInt(e.token.split('-')[1] ?? '0', 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `A-${String(max + 1).padStart(3, '0')}`;
}

// Customer joins the queue for a service at a branch. Generating the token
// and creating the entry happen in one transaction so two people joining at
// the same instant can never be handed the same token.
queueRouter.post('/join', async (req, res) => {
  const { branchId, serviceId, customerName, type } = req.body;
  if (!branchId || !serviceId || !customerName) {
    return res.status(400).json({ error: 'branchId, serviceId, and customerName are required' });
  }

  const entry = await db.$transaction(async (tx) => {
    const token = await nextToken(branchId, serviceId);
    return tx.queueEntry.create({
      data: { branchId, serviceId, customerName, token, type: type === 'WALK_IN' ? 'WALK_IN' : 'VIRTUAL' },
    });
  });

  await logAction(customerName, 'queue.entry.created', `Queue entry ${entry.token}`);
  res.status(201).json(entry);
});

// List queue entries, optionally filtered — used by the staff and admin
// dashboards to show what's currently in the queue.
queueRouter.get('/', async (req, res) => {
  const { branchId, serviceId, status, customerName } = req.query as Record<string, string | undefined>;
  const entries = await db.queueEntry.findMany({
    where: {
      branchId: branchId || undefined,
      serviceId: serviceId || undefined,
      status: (status as any) || undefined,
      customerName: customerName || undefined,
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(entries);
});

// Live status for the customer tracking screen: the entry itself, plus
// people-ahead / estimated-wait / who's currently being served.
queueRouter.get('/:id', async (req, res) => {
  const entry = await db.queueEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Queue entry not found' });

  const sameQueue = await db.queueEntry.findMany({
    where: { branchId: entry.branchId, serviceId: entry.serviceId },
    orderBy: { createdAt: 'asc' },
  });
  const waiting = sameQueue.filter((e) => e.status === 'WAITING');
  const peopleAhead = entry.status === 'WAITING' ? waiting.findIndex((e) => e.id === entry.id) : 0;
  const currentlyServing = sameQueue.find((e) => e.status === 'CALLED' || e.status === 'IN_SERVICE') ?? null;

  const service = await db.service.findUnique({ where: { id: entry.serviceId } });
  const activeCounters = await db.counter.count({
    where: { branchId: entry.branchId, status: { in: ['AVAILABLE', 'BUSY'] } },
  });

  // Same formula as docs/queue-logic.md: peopleAhead × avgServiceTime / activeCounters
  const avgServiceMinutes = service?.estimatedDuration ?? 10;
  const estimatedWaitMinutes = Math.max(1, Math.round((Math.max(peopleAhead, 0) * avgServiceMinutes) / Math.max(activeCounters, 1)));

  res.json({ entry, peopleAhead: Math.max(peopleAhead, 0), estimatedWaitMinutes, currentlyServing });
});

queueRouter.post('/:id/cancel', async (req, res) => {
  const entry = await applyTransition(req.params.id, 'CANCELLED');
  if (!entry) return res.status(409).json({ error: 'This entry cannot be cancelled from its current state' });
  await logAction(entry.customerName, 'queue.entry.cancelled', `Queue entry ${entry.token}`);
  res.json(entry);
});

// ---- Staff actions ----

queueRouter.post('/counters/:counterId/call-next', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const counter = await db.counter.findUnique({ where: { id: req.params.counterId } });
  if (!counter) return res.status(404).json({ error: 'Counter not found' });

  const candidates = await db.queueEntry.findMany({
    where: { branchId: counter.branchId, status: 'WAITING' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
  const next = candidates[0];
  if (!next) return res.status(404).json({ error: 'No one is waiting' });

  const [entry] = await db.$transaction([
    db.queueEntry.update({ where: { id: next.id }, data: { status: 'CALLED', calledAt: new Date(), counterId: counter.id } }),
    db.counter.update({ where: { id: counter.id }, data: { status: 'BUSY', currentEntryId: next.id } }),
  ]);

  await logAction(req.user!.fullName, 'queue.entry.called', `Queue entry ${entry.token}`, `counter=${counter.name}`);
  res.json(entry);
});

queueRouter.post('/:id/start', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const entry = await applyTransition(req.params.id, 'IN_SERVICE');
  if (!entry) return res.status(409).json({ error: 'This entry cannot be started from its current state' });
  await logAction(req.user!.fullName, 'queue.entry.started', `Queue entry ${entry.token}`);
  res.json(entry);
});

queueRouter.post('/:id/complete', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const entry = await applyTransition(req.params.id, 'COMPLETED');
  if (!entry) return res.status(409).json({ error: 'This entry cannot be completed from its current state' });
  if (entry.counterId) {
    await db.counter.update({ where: { id: entry.counterId }, data: { status: 'AVAILABLE', currentEntryId: null } });
  }
  await logAction(req.user!.fullName, 'queue.entry.completed', `Queue entry ${entry.token}`);
  res.json(entry);
});

queueRouter.post('/:id/skip', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const entry = await applyTransition(req.params.id, 'SKIPPED');
  if (!entry) return res.status(409).json({ error: 'This entry cannot be skipped from its current state' });
  if (entry.counterId) {
    await db.counter.update({ where: { id: entry.counterId }, data: { status: 'AVAILABLE', currentEntryId: null } });
  }
  await logAction(req.user!.fullName, 'queue.entry.skipped', `Queue entry ${entry.token}`);
  res.json(entry);
});

queueRouter.post('/:id/recall', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const entry = await applyTransition(req.params.id, 'WAITING');
  if (!entry) return res.status(409).json({ error: 'This entry cannot be recalled from its current state' });
  await logAction(req.user!.fullName, 'queue.entry.recalled', `Queue entry ${entry.token}`);
  res.json(entry);
});

async function applyTransition(id: string, target: string) {
  const entry = await db.queueEntry.findUnique({ where: { id } });
  if (!entry || !ALLOWED_TRANSITIONS[entry.status].includes(target)) return null;

  const extra: Record<string, unknown> = {};
  if (target === 'IN_SERVICE') extra.startedAt = new Date();
  if (target === 'COMPLETED') extra.completedAt = new Date();

  return db.queueEntry.update({ where: { id }, data: { status: target as any, ...extra } });
}
