import { useEffect, useState } from 'react';
import { PhoneCall, Play, CheckCircle2, SkipForward, RotateCcw } from 'lucide-react';
import { ConsoleShell, staffNav } from '../components/ConsoleShell';
import { Button, CounterStatusPill, PriorityTag, StatusPill } from '../components/ui';
import { api } from '../lib/api';

// This demo runs a single seeded branch (Andheri) — see backend/prisma/seed.ts.
const BRANCH_ID = 'branch-andheri';

export function StaffDashboardPage() {
  const [counters, setCounters] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [counterId, setCounterId] = useState('');

  async function refresh() {
    const [countersRes, entriesRes] = await Promise.all([
      api.getCounters(BRANCH_ID),
      api.listQueueEntries({ branchId: BRANCH_ID }),
    ]);
    setCounters(countersRes);
    setEntries(entriesRes);
    if (!counterId && countersRes[0]) setCounterId(countersRes[0].id);

    const serviceIds = [...new Set(entriesRes.map((e) => e.serviceId))];
    const missing = serviceIds.filter((id) => !serviceNames[id]);
    if (missing.length) {
      const pairs = await Promise.all(missing.map(async (id) => [id, (await api.getService(id)).name] as const));
      setServiceNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counter = counters.find((c) => c.id === counterId);
  const currentEntry = entries.find((e) => e.id === counter?.currentEntryId);
  const waiting = entries
    .filter((e) => e.status === 'WAITING')
    .sort((a, b) => {
      const w = { EMERGENCY: 2, HIGH: 1, NORMAL: 0 } as const;
      if (w[b.priority as keyof typeof w] !== w[a.priority as keyof typeof w]) return w[b.priority as keyof typeof w] - w[a.priority as keyof typeof w];
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  const recentlyDone = entries
    .filter((e) => ['COMPLETED', 'SKIPPED'].includes(e.status))
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())
    .slice(0, 5);

  async function withRefresh(action: () => Promise<unknown>) {
    await action();
    refresh();
  }

  return (
    <ConsoleShell nav={staffNav} title="Live queue">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muteOnLight">Operating:</span>
        {counters.map((c) => (
          <button
            key={c.id}
            onClick={() => setCounterId(c.id)}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
              counterId === c.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-panel border border-ink/10 bg-white/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">{counter?.name}</h2>
            {counter && <CounterStatusPill status={counter.status} />}
          </div>

          {currentEntry ? (
            <div>
              <p className="font-mono text-5xl font-semibold tracking-tight">{currentEntry.token}</p>
              <p className="mt-2 text-sm text-muteOnLight">{currentEntry.customerName} · {serviceNames[currentEntry.serviceId]}</p>
              <div className="mt-1"><StatusPill status={currentEntry.status} /></div>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {currentEntry.status === 'CALLED' && (
                  <>
                    <Button size="lg" onClick={() => withRefresh(() => api.startService(currentEntry.id))} className="col-span-2">
                      <Play size={16} /> Start service
                    </Button>
                    <Button variant="ghost" onClick={() => withRefresh(() => api.skipEntry(currentEntry.id))}>
                      <SkipForward size={16} /> Skip
                    </Button>
                    <Button variant="ghost" onClick={() => withRefresh(() => api.recallEntry(currentEntry.id))}>
                      <RotateCcw size={16} /> Recall
                    </Button>
                  </>
                )}
                {currentEntry.status === 'IN_SERVICE' && (
                  <Button size="lg" onClick={() => withRefresh(() => api.completeService(currentEntry.id))} className="col-span-2">
                    <CheckCircle2 size={16} /> Complete service
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muteOnLight">No customer at this counter.</p>
              <Button size="lg" className="mt-4" onClick={() => withRefresh(() => api.callNext(counterId))} disabled={waiting.length === 0}>
                <PhoneCall size={16} /> Call next customer
              </Button>
              {waiting.length === 0 && <p className="mt-2 text-xs text-muteOnLight">Queue is empty.</p>}
            </div>
          )}

          {recentlyDone.length > 0 && (
            <div className="mt-8 border-t border-ink/10 pt-4">
              <p className="mb-2 text-xs font-medium text-muteOnLight">Recent</p>
              <div className="space-y-1.5">
                {recentlyDone.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{e.token}</span>
                    <StatusPill status={e.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-panel border border-ink/10 bg-white/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Waiting ({waiting.length})</h2>
          </div>
          <div className="space-y-2">
            {waiting.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muteOnLight tabular">{i + 1}</span>
                  <span className="font-mono font-medium">{e.token}</span>
                  <span className="text-sm text-muteOnLight">{e.customerName}</span>
                  <PriorityTag priority={e.priority} />
                </div>
                <span className="text-xs text-muteOnLight">{e.type === 'VIRTUAL' ? 'Virtual' : 'Walk-in'}</span>
              </div>
            ))}
            {waiting.length === 0 && <p className="py-8 text-center text-sm text-muteOnLight">Nobody's waiting right now.</p>}
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
