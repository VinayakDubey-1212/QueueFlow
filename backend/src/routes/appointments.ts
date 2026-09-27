import { Router } from 'express';
import { db } from '../db';
import { logAction } from '../audit';

export const appointmentsRouter = Router();

appointmentsRouter.post('/', async (req, res) => {
  const { branchId, serviceId, customerName, scheduledAt } = req.body;
  if (!branchId || !serviceId || !customerName || !scheduledAt) {
    return res.status(400).json({ error: 'branchId, serviceId, customerName, and scheduledAt are required' });
  }

  const appointment = await db.appointment.create({
    data: { branchId, serviceId, customerName, scheduledAt: new Date(scheduledAt) },
  });
  await logAction(customerName, 'appointment.created', `Appointment for ${customerName}`);
  res.status(201).json(appointment);
});

// Simple demo auth: appointments are looked up by customer name rather than
// a full user-account relationship, to keep the schema small.
appointmentsRouter.get('/', async (req, res) => {
  const customerName = req.query.customerName as string | undefined;
  res.json(await db.appointment.findMany({
    where: customerName ? { customerName } : undefined,
    orderBy: { scheduledAt: 'desc' },
  }));
});

appointmentsRouter.post('/:id/cancel', async (req, res) => {
  const appointment = await db.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });
  await logAction(appointment.customerName, 'appointment.cancelled', `Appointment ${appointment.id}`);
  res.json(appointment);
});
