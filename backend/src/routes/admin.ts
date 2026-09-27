import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../auth';

export const adminRouter = Router();

adminRouter.get('/audit-log', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  res.json(await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }));
});

// A handful of numbers the admin dashboard needs, computed in one place
// instead of the frontend re-deriving them from raw lists.
adminRouter.get('/dashboard', requireAuth, requireRole('ADMIN', 'STAFF'), async (_req, res) => {
  const [waiting, inService, completed, cancelled, counters, appointments] = await Promise.all([
    db.queueEntry.count({ where: { status: 'WAITING' } }),
    db.queueEntry.count({ where: { status: 'IN_SERVICE' } }),
    db.queueEntry.findMany({ where: { status: 'COMPLETED' } }),
    db.queueEntry.count({ where: { status: 'CANCELLED' } }),
    db.counter.findMany(),
    db.appointment.findMany({ where: { status: 'SCHEDULED' } }),
  ]);

  const avgMinutes = (fromField: 'createdAt' | 'startedAt', toField: 'startedAt' | 'completedAt') => {
    const durations = completed
      .map((e) => {
        const from = e[fromField]?.getTime();
        const to = e[toField]?.getTime();
        return from && to ? (to - from) / 60000 : null;
      })
      .filter((n): n is number => n !== null);
    return durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  };

  res.json({
    waiting,
    inService,
    completedCount: completed.length,
    cancelled,
    activeCounters: counters.filter((c) => c.status === 'AVAILABLE' || c.status === 'BUSY').length,
    totalCounters: counters.length,
    upcomingAppointments: appointments.length,
    avgWaitMinutes: avgMinutes('createdAt', 'startedAt'),
    avgServiceMinutes: avgMinutes('startedAt', 'completedAt'),
  });
});
