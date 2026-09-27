import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding QueueFlow demo data...');

  // ---- Users ----
  const users = [
    { email: 'customer@example.com', password: 'Customer@123', fullName: 'Demo Customer', role: 'CUSTOMER' as const },
    { email: 'staff1@citycare.dev', password: 'Staff@123', fullName: 'Rahul Verma', role: 'STAFF' as const },
    { email: 'staff2@citycare.dev', password: 'Staff@123', fullName: 'Anjali Deshmukh', role: 'STAFF' as const },
    { email: 'admin@citycare.dev', password: 'Admin@123', fullName: 'Priya Sharma', role: 'ADMIN' as const },
  ];
  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, fullName: u.fullName, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) },
    });
  }

  // ---- Organization & branches ----
  const org = await db.organization.upsert({
    where: { slug: 'citycare-clinic' },
    update: {},
    create: {
      name: 'CityCare Clinic',
      slug: 'citycare-clinic',
      description: 'A multi-branch clinic offering general and dental consultations.',
    },
  });

  const andheri = await db.branch.upsert({
    where: { id: 'branch-andheri' },
    update: {},
    create: { id: 'branch-andheri', organizationId: org.id, name: 'Andheri', address: 'Andheri West, Mumbai' },
  });
  const vileParle = await db.branch.upsert({
    where: { id: 'branch-vileparle' },
    update: {},
    create: { id: 'branch-vileparle', organizationId: org.id, name: 'Vile Parle', address: 'Vile Parle East, Mumbai' },
  });

  // ---- Services (connected to the branches that offer them) ----
  const general = await db.service.upsert({
    where: { id: 'svc-general' },
    update: {},
    create: {
      id: 'svc-general', organizationId: org.id, name: 'General Consultation',
      description: 'Routine check-ups and general medical advice.', estimatedDuration: 10,
      branches: { connect: [{ id: andheri.id }, { id: vileParle.id }] },
    },
  });
  await db.service.upsert({
    where: { id: 'svc-dental' },
    update: {},
    create: {
      id: 'svc-dental', organizationId: org.id, name: 'Dental Consultation',
      description: 'Dental exams and consultations.', estimatedDuration: 20,
      branches: { connect: [{ id: andheri.id }] },
    },
  });
  await db.service.upsert({
    where: { id: 'svc-billing' },
    update: {},
    create: {
      id: 'svc-billing', organizationId: org.id, name: 'Billing',
      description: 'Payments, insurance queries, and receipts.', estimatedDuration: 5,
      branches: { connect: [{ id: andheri.id }, { id: vileParle.id }] },
    },
  });

  // ---- Counters ----
  const staff1 = await db.user.findUniqueOrThrow({ where: { email: 'staff1@citycare.dev' } });
  const staff2 = await db.user.findUniqueOrThrow({ where: { email: 'staff2@citycare.dev' } });

  await db.counter.upsert({
    where: { id: 'counter-1' },
    update: {},
    create: { id: 'counter-1', branchId: andheri.id, name: 'Counter 1', status: 'AVAILABLE', assignedStaffId: staff1.id },
  });
  await db.counter.upsert({
    where: { id: 'counter-2' },
    update: {},
    create: { id: 'counter-2', branchId: andheri.id, name: 'Counter 2', status: 'AVAILABLE', assignedStaffId: staff2.id },
  });
  await db.counter.upsert({
    where: { id: 'counter-3' },
    update: {},
    create: { id: 'counter-3', branchId: andheri.id, name: 'Counter 3', status: 'OFFLINE' },
  });
  await db.counter.upsert({
    where: { id: 'counter-4' },
    update: {},
    create: { id: 'counter-4', branchId: vileParle.id, name: 'Counter 1', status: 'AVAILABLE' },
  });

  // ---- A few sample queue entries so the demo isn't empty on first load ----
  const existingEntries = await db.queueEntry.count({ where: { branchId: andheri.id, serviceId: general.id } });
  if (existingEntries === 0) {
    const names = ['Neha Joshi', 'Vikram Rao', 'Ishita Nair', 'Om Patil', 'Riya Shah'];
    for (let i = 0; i < names.length; i++) {
      await db.queueEntry.create({
        data: {
          branchId: andheri.id,
          serviceId: general.id,
          customerName: names[i],
          token: `A-${String(100 + i).padStart(3, '0')}`,
          type: i % 2 === 0 ? 'WALK_IN' : 'VIRTUAL',
          priority: i === 1 ? 'HIGH' : 'NORMAL',
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('---------------------------------------------');
  console.log('Customer : customer@example.com / Customer@123');
  console.log('Staff 1  : staff1@citycare.dev / Staff@123 (Counter 1)');
  console.log('Staff 2  : staff2@citycare.dev / Staff@123 (Counter 2)');
  console.log('Admin    : admin@citycare.dev / Admin@123');
  console.log('---------------------------------------------');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
