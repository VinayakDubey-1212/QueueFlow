import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { api } from '../lib/api';

interface Org { id: string; name: string; slug: string; description: string }

export function OrgDiscoveryPage() {
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOrganizations().then(setOrgs).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Find an organization</h1>
        <p className="mt-2 text-sm text-muteOnLight">Choose where you'd like to book an appointment or join a queue.</p>

        {error && <p className="mt-6 text-sm text-alert">Couldn't reach the backend ({error}). Is it running on port 4000?</p>}
        {!orgs && !error && <p className="mt-6 text-sm text-muteOnLight">Loading organizations…</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {orgs?.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}`}
              className="group rounded-panel border border-ink/12 p-5 transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-medium">{org.name}</h2>
                <ArrowRight size={16} className="mt-1 text-muteOnLight transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muteOnLight">{org.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
