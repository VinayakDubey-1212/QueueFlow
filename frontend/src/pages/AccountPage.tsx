import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, X } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../store/useSession';

export function AccountPage() {
  const user = useSession((s) => s.user);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});

  async function load() {
    if (!user) return;
    const [appts, entries] = await Promise.all([
      api.listAppointments(user.fullName),
      api.listQueueEntries({ customerName: user.fullName }),
    ]);
    setAppointments(appts);
    setQueueEntries(entries.filter((e) => e.status !== 'CANCELLED'));

    // Resolve branch/service names for display (small lookups, cached locally).
    const branchIds = [...new Set([...appts, ...entries].map((x) => x.branchId))];
    const serviceIds = [...new Set([...appts, ...entries].map((x) => x.serviceId))];
    const branchPairs = await Promise.all(branchIds.map(async (id) => [id, (await api.getBranch(id)).name] as const));
    const servicePairs = await Promise.all(serviceIds.map(async (id) => [id, (await api.getService(id)).name] as const));
    setBranchNames(Object.fromEntries(branchPairs));
    setServiceNames(Object.fromEntries(servicePairs));
  }

  useEffect(() => { load(); }, [user]);

  async function handleCancelAppointment(id: string) {
    await api.cancelAppointment(id);
    load();
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
        <p className="mt-1 text-sm text-muteOnLight">{user?.fullName} · {user?.email}</p>

        {queueEntries.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium">Active queue entries</h2>
            <div className="space-y-2.5">
              {queueEntries.map((e) => (
                <Link key={e.id} to={`/queue/${e.id}`} className="flex items-center justify-between rounded-lg border border-ink/15 p-4 hover:border-ink/30 transition-colors">
                  <div>
                    <p className="font-mono font-semibold">{e.token}</p>
                    <p className="text-sm text-muteOnLight">{serviceNames[e.serviceId]}</p>
                  </div>
                  <StatusPill status={e.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium">Appointments</h2>
          <div className="space-y-2.5">
            {appointments.length === 0 && <p className="text-sm text-muteOnLight">No appointments yet.</p>}
            {appointments
              .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
              .map((a) => {
                const date = new Date(a.scheduledAt);
                const upcoming = a.status === 'SCHEDULED';
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink/15 p-4">
                    <div>
                      <p className="font-medium">{serviceNames[a.serviceId]}</p>
                      <p className="mt-1 flex items-center gap-3 text-sm text-muteOnLight">
                        <span className="flex items-center gap-1"><Calendar size={13} /> {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} /> {branchNames[a.branchId]}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={a.status === 'SCHEDULED' ? 'WAITING' : a.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED'} />
                      {upcoming && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancelAppointment(a.id)}>
                          <X size={14} /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        <Link to="/organizations" className="mt-10 inline-block text-sm font-medium text-amber-dim hover:underline">
          Book another appointment or join a queue
        </Link>
      </div>
    </div>
  );
}
