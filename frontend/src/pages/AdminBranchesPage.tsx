import { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { ConsoleShell, adminNav } from '../components/ConsoleShell';
import { Panel } from '../components/ui';
import { api } from '../lib/api';

export function AdminBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    api.getOrganizations().then(async (orgs) => {
      const org = orgs[0];
      if (!org) return;
      setBranches(await api.getBranches(org.id));
      setServices(await api.getOrgServices(org.id));
    });
  }, []);

  return (
    <ConsoleShell nav={adminNav} title="Branches & services">
      <section>
        <h2 className="mb-3 text-sm font-medium">Branches</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <Panel key={b.id} className="p-4">
              <p className="font-medium">{b.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muteOnLight"><MapPin size={13} /> {b.address}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium">Services</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <Panel key={s.id} className="p-4">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-sm text-muteOnLight">{s.description}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muteOnLight"><Clock size={12} /> ~{s.estimatedDuration} min</p>
              <p className="mt-1 text-xs text-muteOnLight">Available at {s.branches?.length ?? 0} branch{s.branches?.length !== 1 ? 'es' : ''}</p>
            </Panel>
          ))}
        </div>
      </section>
    </ConsoleShell>
  );
}
