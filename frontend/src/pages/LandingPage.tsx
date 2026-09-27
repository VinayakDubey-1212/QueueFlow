import { Link } from 'react-router-dom';
import { ArrowRight, Radio, Clock, ShieldCheck, Building2 } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="animate-rise-in">
          <p className="mb-5 text-sm font-medium text-amber-dim">For clinics, banks, offices, and service centers</p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
            Nobody should stand in a line to find out how long the line is.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muteOnLight">
            QueueFlow replaces the waiting room with a live token, a real position, and an
            honest estimate — updated the moment a counter calls the next person.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/organizations" className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3.5 text-base font-medium text-paper hover:bg-ink-soft transition-colors">
              Join a queue <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-6 py-3.5 text-base font-medium hover:bg-ink/5 transition-colors">
              Sign in to a console
            </Link>
          </div>
        </div>

        {/* The hero IS the live queue board — the most characteristic screen in the product */}
        <div className="animate-rise-in rounded-panel bg-ink p-7 text-paper shadow-2xl [animation-delay:120ms]" style={{ animationFillMode: 'both' }}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muteOnDark">
              <Radio size={13} className="animate-live-pulse text-amber" />
              Live · CityCare Clinic, Andheri
            </div>
            <span className="rounded-chip bg-white/5 px-2.5 py-1 text-xs">General Consultation</span>
          </div>

          <div className="mb-8">
            <p className="text-xs text-muteOnDark">Your token</p>
            <p className="font-mono text-6xl font-semibold tracking-tight text-amber">A-104</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 md:grid-cols-4">
            <Stat label="Now serving" value="A-098" />
            <Stat label="People ahead" value="6" />
            <Stat label="Est. wait" value="~32 min" />
            <Stat label="Counter" value="2" />
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-paper-soft">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3">
            <Feature icon={<Clock size={20} />} title="A wait time, not a promise" text="Estimates come from real service-duration history per branch and service, shown as an approximation — never a guarantee." />
            <Feature icon={<Radio size={20} />} title="Updates without a refresh" text="The moment a counter calls the next customer, every screen watching that queue updates — no polling, no stale numbers." />
            <Feature icon={<ShieldCheck size={20} />} title="One organization, one dataset" text="Every branch, counter, and queue is scoped to its own organization on the backend — never trusted from the browser." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3 text-sm text-muteOnLight">
          <Building2 size={16} />
          Built for multi-branch organizations — see it running for a clinic, a bank, and a government office.
        </div>
        <Link to="/organizations" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-dim hover:underline">
          Browse organizations <ArrowRight size={14} />
        </Link>
      </section>

      <footer className="border-t border-ink/10 px-6 py-8 text-center text-xs text-muteOnLight">
        QueueFlow — a demo operations platform for appointments, walk-ins, and real-time queues.
      </footer>
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

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-amber">{icon}</div>
      <h3 className="mb-1.5 font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-muteOnLight">{text}</p>
    </div>
  );
}
