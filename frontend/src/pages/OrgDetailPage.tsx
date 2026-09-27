import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../store/useSession';

interface Branch { id: string; name: string; address: string }
interface Service { id: string; name: string; description: string; estimatedDuration: number }

export function OrgDetailPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);

  const [orgName, setOrgName] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    api.getOrganizations().then((orgs) => setOrgName(orgs.find((o) => o.id === orgId)?.name ?? ''));
    api.getBranches(orgId).then((list) => {
      setBranches(list);
      if (list[0]) setBranchId(list[0].id);
    });
  }, [orgId]);

  useEffect(() => {
    if (!branchId) return;
    setServiceId(null);
    api.getServices(branchId).then(setServices);
  }, [branchId]);

  async function handleJoinQueue() {
    if (!serviceId) return;
    setJoining(true);
    try {
      const entry = await api.joinQueue({
        branchId, serviceId, customerName: user?.fullName ?? 'Guest Customer', type: 'VIRTUAL',
      });
      navigate(`/queue/${entry.id}`);
    } finally {
      setJoining(false);
    }
  }

  function handleBookAppointment() {
    if (!serviceId) return;
    navigate(`/organizations/${orgId}/book?branch=${branchId}&service=${serviceId}`);
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muteOnLight">Organization</p>
        <h1 className="text-2xl font-semibold tracking-tight">{orgName || '…'}</h1>

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium">1. Choose a branch</h2>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setBranchId(b.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  branchId === b.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink/40'
                }`}
              >
                <MapPin size={14} />
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium">2. Choose a service</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  serviceId === s.id ? 'border-ink bg-ink/5' : 'border-ink/15 hover:border-ink/30'
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 text-sm text-muteOnLight">{s.description}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muteOnLight">
                  <Clock size={12} /> ~{s.estimatedDuration} min
                </p>
              </button>
            ))}
            {services.length === 0 && <p className="text-sm text-muteOnLight">No services available at this branch.</p>}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" onClick={handleJoinQueue} disabled={!serviceId || joining}>
            {joining ? 'Joining…' : 'Join virtual queue now'} <ArrowRight size={16} />
          </Button>
          <Button size="lg" variant="ghost" onClick={handleBookAppointment} disabled={!serviceId}>
            Book an appointment instead
          </Button>
        </div>
      </div>
    </div>
  );
}
