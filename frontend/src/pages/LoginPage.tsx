import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Headset, ShieldCheck } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/ui';
import { DEMO_ACCOUNTS, useSession } from '../store/useSession';

const roles = [
  { key: 'customer' as const, label: 'Customer', icon: Stethoscope, desc: 'Book appointments and track your place in line.', dest: '/account' },
  { key: 'staff' as const, label: 'Staff', icon: Headset, desc: 'Operate a counter and call the next customer.', dest: '/staff' },
  { key: 'admin' as const, label: 'Org Admin', icon: ShieldCheck, desc: 'Manage branches, services, counters, and staff.', dest: '/admin' },
];

export function LoginPage() {
  const [selected, setSelected] = useState<typeof roles[number]['key']>('customer');
  const login = useSession((s) => s.login);
  const loading = useSession((s) => s.loading);
  const error = useSession((s) => s.error);
  const navigate = useNavigate();

  async function handleSignIn() {
    const account = DEMO_ACCOUNTS[selected];
    try {
      await login(account.email, account.password);
      navigate(roles.find((r) => r.key === selected)!.dest);
    } catch {
      // error is already surfaced via the store's `error` field
    }
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muteOnLight">
          Pick a demo account to see its console. These are real accounts created by the backend seed script.
        </p>

        <div className="mt-8 space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const active = selected === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                className={`flex w-full items-start gap-3.5 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                  active ? 'border-ink bg-ink/5' : 'border-ink/15 hover:border-ink/30'
                }`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-ink text-amber' : 'bg-ink/8 text-ink/60'}`}>
                  <Icon size={17} />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{r.label}</span>
                    <span className="font-mono text-xs text-muteOnLight">{DEMO_ACCOUNTS[r.key].email}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muteOnLight">{r.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm text-alert">{error}. Did you run the backend's seed script?</p>}

        <Button onClick={handleSignIn} size="lg" className="mt-8 w-full" disabled={loading}>
          {loading ? 'Signing in…' : `Continue as ${roles.find((r) => r.key === selected)?.label}`}
        </Button>
      </div>
    </div>
  );
}
