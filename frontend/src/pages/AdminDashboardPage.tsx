import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle2, Building2 } from 'lucide-react';
import { ConsoleShell, adminNav } from '../components/ConsoleShell';
import { BarChart, DonutStat, Sparkline } from '../components/Charts';
import { api } from '../lib/api';

interface Dashboard {
  waiting: number; inService: number; completedCount: number; cancelled: number;
  activeCounters: number; totalCounters: number; upcomingAppointments: number;
  avgWaitMinutes: number; avgServiceMinutes: number;
}

// A few illustrative points for the hourly chart — the backend doesn't
// track hour-by-hour history yet, so this stays a visual placeholder
// alongside the real numbers above it.
const hourly = [
  { label: '9a', value: 3 }, { label: '10a', value: 6 }, { label: '11a', value: 9 },
  { label: '12p', value: 5 }, { label: '1p', value: 2 }, { label: '2p', value: 7 },
  { label: '3p', value: 8 }, { label: '4p', value: 4 },
];

export function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => { api.getDashboard().then(setData); }, []);

  if (!data) {
    return <ConsoleShell nav={adminNav} title="Dashboard"><p className="text-sm text-muteOnLight">Loading…</p></ConsoleShell>;
  }

  return (
    <ConsoleShell nav={adminNav} title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Clock size={16} />} label="Currently waiting" value={String(data.waiting)} />
        <MetricCard icon={<Users size={16} />} label="Currently serving" value={String(data.inService)} />
        <MetricCard icon={<CheckCircle2 size={16} />} label="Completed" value={String(data.completedCount)} />
        <MetricCard icon={<Building2 size={16} />} label="Active counters" value={`${data.activeCounters} / ${data.totalCounters}`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-panel border border-ink/10 bg-white/60 p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Customers served by hour</h2>
          <BarChart data={hourly} />
        </div>
        <div className="rounded-panel border border-ink/10 bg-white/60 p-6">
          <h2 className="mb-4 text-sm font-medium">Completed vs cancelled</h2>
          <div className="flex items-center justify-center">
            <DonutStat value={data.completedCount} total={data.completedCount + data.cancelled} />
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xs text-muteOnLight">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber" /> Completed ({data.completedCount})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink/15" /> Cancelled ({data.cancelled})</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-panel border border-ink/10 bg-white/60 p-5">
          <p className="text-xs text-muteOnLight">Avg waiting time</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{data.avgWaitMinutes} min</p>
          <Sparkline data={[12, 15, 9, 18, 14, data.avgWaitMinutes]} height={40} width={160} />
        </div>
        <div className="rounded-panel border border-ink/10 bg-white/60 p-5">
          <p className="text-xs text-muteOnLight">Avg service time</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{data.avgServiceMinutes} min</p>
          <Sparkline data={[8, 7, 9, 6, 8, data.avgServiceMinutes]} height={40} width={160} color="#2FB673" />
        </div>
        <div className="rounded-panel border border-ink/10 bg-white/60 p-5">
          <p className="text-xs text-muteOnLight">Cancelled</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{data.cancelled}</p>
        </div>
        <div className="rounded-panel border border-ink/10 bg-white/60 p-5">
          <p className="text-xs text-muteOnLight">Upcoming appointments</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{data.upcomingAppointments}</p>
        </div>
      </div>
    </ConsoleShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-panel border border-ink/10 bg-white/60 p-5">
      <div className="flex items-center gap-2 text-muteOnLight">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular">{value}</p>
    </div>
  );
}
