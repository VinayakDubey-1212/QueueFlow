// UI-facing types. Data from the API is loosely typed (see src/lib/api.ts)
// to keep this a small demo project — these enums are what the shared
// components (badges, pills) need to render correctly, and they match the
// enums defined in backend/prisma/schema.prisma exactly.

export type QueueEntryStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
export type CounterStatus = 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFFLINE';
export type PriorityLevel = 'NORMAL' | 'HIGH' | 'EMERGENCY';
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
