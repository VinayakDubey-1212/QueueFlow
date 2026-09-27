import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../store/useSession';

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:30', '14:00', '14:30', '15:30', '16:00'];

export function BookAppointmentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const branchId = params.get('branch') ?? '';
  const serviceId = params.get('service') ?? '';

  const [branch, setBranch] = useState<{ name: string } | null>(null);
  const [service, setService] = useState<{ name: string; estimatedDuration: number } | null>(null);

  useEffect(() => {
    if (branchId) api.getBranch(branchId).then(setBranch);
    if (serviceId) api.getService(serviceId).then(setService);
  }, [branchId, serviceId]);

  const days = useMemo(() => nextDays(7), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState(false);

  async function handleConfirm() {
    if (!slot) return;
    setBooking(true);
    const day = days[dayIndex];
    const [h, m] = slot.split(':').map(Number);
    const scheduledAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).toISOString();
    try {
      await api.bookAppointment({ branchId, serviceId, customerName: user?.fullName ?? 'Guest Customer', scheduledAt });
      setConfirmed(true);
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <CheckCircle2 className="mx-auto text-confirm" size={40} />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Appointment booked</h1>
          <p className="mt-2 text-sm text-muteOnLight">
            {service?.name} at {branch?.name} on {days[dayIndex].toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {slot}.
          </p>
          <Button className="mt-6" onClick={() => navigate('/account')}>View my appointments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muteOnLight">{branch?.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Book {service?.name ?? '…'}</h1>
        {service && <p className="mt-1 text-sm text-muteOnLight">~{service.estimatedDuration} min appointment</p>}

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium">Choose a date</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => { setDayIndex(i); setSlot(null); }}
                className={`flex shrink-0 flex-col items-center rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  dayIndex === i ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink/40'
                }`}
              >
                <span className="text-xs opacity-70">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className="font-medium">{d.getDate()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium">Choose a time</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`rounded-lg border py-2.5 text-sm font-mono transition-colors ${
                  slot === s ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" className="mt-10" onClick={handleConfirm} disabled={!slot || booking}>
          {booking ? 'Booking…' : 'Confirm appointment'}
        </Button>
      </div>
    </div>
  );
}
