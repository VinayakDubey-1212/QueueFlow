import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, ListChecks, ClipboardList, LogOut } from 'lucide-react';
import { useSession } from '../store/useSession';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export function ConsoleShell({ children, nav, title }: { children: ReactNode; nav: NavItem[]; title: string }) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-16 flex-col items-center gap-1 border-r border-ink/10 bg-paper-soft py-5 md:w-56 md:items-stretch md:px-3">
        <Link to="/" className="mb-6 flex items-center gap-2.5 px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-amber">
            <span className="font-mono text-sm font-semibold">Q</span>
          </span>
          <span className="hidden text-base font-semibold tracking-tight md:inline">QueueFlow</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-ink/5'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-ink/5"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink/10 bg-paper-soft px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muteOnLight">CityCare Clinic · Andheri</p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium leading-tight">{user.fullName}</p>
                <p className="text-xs text-muteOnLight leading-tight">{user.role}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper text-sm font-semibold">
                {user.fullName.charAt(0)}
              </div>
            </div>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export const staffNav: NavItem[] = [
  { to: '/staff', label: 'Live queue', icon: <ListChecks size={18} /> },
];

export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/branches', label: 'Branches & services', icon: <Building2 size={18} /> },
  { to: '/admin/staff', label: 'Staff & counters', icon: <Users size={18} /> },
  { to: '/admin/audit', label: 'Audit log', icon: <ClipboardList size={18} /> },
];
