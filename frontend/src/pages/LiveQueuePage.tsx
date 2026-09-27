import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio, XCircle } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/ui';
import { api } from '../lib/api';

interface QueueStatus {
  entry: {
    id: string; token: string; status: string; branchId: string; serviceId: string;
  };
  peopleAhead: number;
  estimatedWaitMinutes: number;
  currentlyServing: { token: string; counterId?: string } | null;
}

export function LiveQueuePage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<QueueStatus | null>(null);
  const [branchName, setBranchName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servingCounterName, setServingCounterName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!entryId) return;
    try {
      const status = await api.getQueueEntry(entryId);
      setData(status);
      if (!branchName) {
        api.getBranch(status.entry.branchId).then((b) => setBranchName(b.name));
        api.getService(status.entry.serviceId).then((s) => setServiceName(s.name));
      }
      if (status.currentlyServing?.counterId) {
        const counters = await api.getCounters(status.entry.branchId);
        setServingCounterName(counters.find((c) => c.id === status.currentlyServing!.counterId)?.name ?? '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load queue status');
    }
  }

  // Poll every 5s — stands in for the WebSocket push a production build
  // would use, without needing a live socket server for this demo.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  async function handleCancel() {
    if (!entryId) return;
    await api.cancelQueueEntry(entryId);
    refresh();
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <div className="mx-auto max-w-md px-6 py-24 text-center text-muteOnLight">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <div className="mx-auto max-w-md px-6 py-24 text-center text-muteOnLight">Loading…</div>
      </div>
    );
  }

  const { entry, peopleAhead, estimatedWaitMinutes, currentlyServing } = data;
  const isDone = entry.status === 'COMPLETED';
  const isCancelled = entry.status === 'CANCELLED';
  const isCalled = entry.status === 'CALLED';

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-panel bg-ink p-7 text-paper md:p-9">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muteOnDark">
              {!isDone && !isCancelled && <Radio size={13} className="animate-live-pulse text-amber" />}
              Live · {branchName}
            </div>
            <span className="rounded-chip bg-white/5 px-2.5 py-1 text-xs">{serviceName}</span>
          </div>

          <div className="mb-8">
            <p className="text-xs text-muteOnDark">Your token</p>
            <p className="font-mono text-7xl font-semibold tracking-tight text-amber">{entry.token}</p>
            <p className="mt-3 text-sm">
              {isDone && 'Service completed. Thank you.'}
              {isCancelled && 'This queue entry was cancelled.'}
              {isCalled && `You're being called — please proceed to ${servingCounterName || 'the counter'}.`}
              {entry.status === 'IN_SERVICE' && 'You are currently being served.'}
              {entry.status === 'WAITING' && (peopleAhead === 0 ? "You're next in line." : `${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you.`)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-6 md:grid-cols-4">
            <Stat label="Now serving" value={currentlyServing?.token ?? '—'} />
            <Stat label="People ahead" value={entry.status === 'WAITING' ? String(peopleAhead) : '0'} />
            <Stat label="Est. wait" value={entry.status === 'WAITING' ? `~${estimatedWaitMinutes} min` : '—'} />
            <Stat label="Counter" value={servingCounterName || '—'} />
          </div>
        </div>

        {entry.status === 'WAITING' && (
          <Button variant="ghost" className="mt-8" onClick={handleCancel}>
            <XCircle size={16} /> Cancel my place in queue
          </Button>
        )}
        {(isDone || isCancelled) && (
          <Button className="mt-8" onClick={() => navigate('/organizations')}>Back to organizations</Button>
        )}

        <p className="mt-4 text-xs text-muteOnLight">
          Estimated wait is approximate and based on current queue conditions — it is not a guarantee.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muteOnDark">{label}</p>
      <p className="font-mono text-xl font-medium tabular">{value}</p>
    </div>
  );
}
