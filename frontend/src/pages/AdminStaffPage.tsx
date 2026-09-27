import { useEffect, useState } from 'react';
import { ConsoleShell, adminNav } from '../components/ConsoleShell';
import { CounterStatusPill, Panel } from '../components/ui';
import { api } from '../lib/api';

// The seeded demo staff — see backend/prisma/seed.ts. There's no
// staff-listing endpoint yet (kept out of scope for this demo), so this
// roster is just for display; counters below are fetched live.
const staffRoster = [
  { id: 'staff-rahul', name: 'Rahul Verma', email: 'staff1@citycare.dev' },
  { id: 'staff-anjali', name: 'Anjali Deshmukh', email: 'staff2@citycare.dev' },
];

const BRANCH_ID = 'branch-andheri';

export function AdminStaffPage() {
  const [counters, setCounters] = useState<any[]>([]);

  useEffect(() => { api.getCounters(BRANCH_ID).then(setCounters); }, []);

  return (
    <ConsoleShell nav={adminNav} title="Staff & counters">
      <section>
        <h2 className="mb-3 text-sm font-medium">Staff</h2>
        <Panel className="divide-y divide-ink/10">
          {staffRoster.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muteOnLight">{s.email}</p>
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium">Counters</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {counters.map((c) => (
            <Panel key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{c.name}</p>
                <CounterStatusPill status={c.status} />
              </div>
              <p className="mt-2 text-xs text-muteOnLight">
                {staffRoster.find((s) => s.id === c.assignedStaffId)?.name ?? 'Unassigned'}
              </p>
            </Panel>
          ))}
        </div>
      </section>
    </ConsoleShell>
  );
}
