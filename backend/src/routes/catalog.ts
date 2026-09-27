import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, AuthedRequest } from '../auth';
import { logAction } from '../audit';

export const catalogRouter = Router();

// ---- Organizations (public — anyone browsing can see these) ----

catalogRouter.get('/organizations', async (_req, res) => {
  res.json(await db.organization.findMany());
});

catalogRouter.get('/organizations/:id', async (req, res) => {
  const org = await db.organization.findUnique({ where: { id: req.params.id } });
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

catalogRouter.get('/organizations/:id/branches', async (req, res) => {
  res.json(await db.branch.findMany({ where: { organizationId: req.params.id } }));
});

catalogRouter.get('/organizations/:id/services', async (req, res) => {
  res.json(await db.service.findMany({ where: { organizationId: req.params.id }, include: { branches: true } }));
});

catalogRouter.get('/branches/:id', async (req, res) => {
  const branch = await db.branch.findUnique({ where: { id: req.params.id } });
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

catalogRouter.get('/services/:id', async (req, res) => {
  const service = await db.service.findUnique({ where: { id: req.params.id } });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

// ---- Branches & services ----

catalogRouter.get('/branches/:branchId/services', async (req, res) => {
  const services = await db.service.findMany({
    where: { branches: { some: { id: req.params.branchId } } },
  });
  res.json(services);
});

// ---- Counters ----

catalogRouter.get('/branches/:branchId/counters', async (req, res) => {
  res.json(await db.counter.findMany({ where: { branchId: req.params.branchId } }));
});

// Staff/admin can change a counter's status (available, on break, offline).
catalogRouter.patch('/counters/:id/status', requireAuth, requireRole('STAFF', 'ADMIN'), async (req: AuthedRequest, res) => {
  const { status } = req.body;
  const counter = await db.counter.update({ where: { id: req.params.id }, data: { status } });
  await logAction(req.user!.fullName, 'counter.status_changed', `Counter ${counter.name}`, status);
  res.json(counter);
});
