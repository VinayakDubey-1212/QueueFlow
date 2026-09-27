import { db } from './db';

/** Writes one row to the audit log. Called after any action worth tracking. */
export function logAction(actor: string, action: string, entity: string, metadata?: string) {
  return db.auditLog.create({ data: { actor, action, entity, metadata } });
}
