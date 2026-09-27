import { ReactNode } from 'react';
import { QueueEntryStatus, CounterStatus, PriorityLevel } from '../types';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-panel border border-ink/10 bg-white/60 ${className}`}>{children}</div>;
}

export function Button({
  children, onClick, variant = 'primary', disabled, className = '', type = 'button', size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3.5 text-base' };
  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink-soft',
    secondary: 'bg-amber text-ink hover:bg-amber-soft',
    ghost: 'bg-transparent text-ink hover:bg-ink/5 border border-ink/20',
    danger: 'bg-alert text-white hover:bg-red-600',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

const statusColors: Record<QueueEntryStatus, string> = {
  WAITING: 'bg-ink/8 text-ink',
  CALLED: 'bg-amber/20 text-amber-dim',
  IN_SERVICE: 'bg-confirm/15 text-confirm',
  COMPLETED: 'bg-ink/8 text-muteOnLight',
  SKIPPED: 'bg-alert/10 text-alert',
  CANCELLED: 'bg-ink/8 text-muteOnLight',
};

export function StatusPill({ status }: { status: QueueEntryStatus }) {
  return <span className={`inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}>{status.replace('_', ' ')}</span>;
}

const counterColors: Record<CounterStatus, string> = {
  AVAILABLE: 'bg-confirm/15 text-confirm',
  BUSY: 'bg-amber/20 text-amber-dim',
  BREAK: 'bg-ink/8 text-muteOnLight',
  OFFLINE: 'bg-ink/8 text-muteOnLight',
};

export function CounterStatusPill({ status }: { status: CounterStatus }) {
  return <span className={`inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-medium ${counterColors[status]}`}>{status}</span>;
}

const priorityColors: Record<PriorityLevel, string> = {
  NORMAL: 'text-muteOnLight',
  HIGH: 'text-amber-dim',
  EMERGENCY: 'text-alert',
};

export function PriorityTag({ priority }: { priority: PriorityLevel }) {
  if (priority === 'NORMAL') return null;
  return <span className={`text-xs font-semibold ${priorityColors[priority]}`}>{priority}</span>;
}
