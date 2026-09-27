import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../store/useSession';

export function PublicNav() {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();

  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-amber">
            <span className="font-mono text-sm font-semibold">Q</span>
          </span>
          <span className="text-lg font-semibold tracking-tight">QueueFlow</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/organizations" className="hover:text-amber-dim transition-colors">Find an organization</Link>
          {user ? (
            <button
              onClick={() => navigate(user.role === 'STAFF' ? '/staff' : user.role === 'ADMIN' ? '/admin' : '/account')}
              className="rounded-lg bg-ink px-4 py-2 text-paper hover:bg-ink-soft transition-colors"
            >
              {user.role === 'STAFF' ? 'Staff console' : user.role === 'ADMIN' ? 'Admin console' : 'My account'}
            </button>
          ) : (
            <Link to="/login" className="rounded-lg bg-ink px-4 py-2 text-paper hover:bg-ink-soft transition-colors">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
