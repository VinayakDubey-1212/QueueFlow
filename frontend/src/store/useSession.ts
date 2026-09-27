import { create } from 'zustand';
import { api, clearToken, saveToken } from '../lib/api';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Demo seeded accounts (see backend/prisma/seed.ts) — used by the login
// page's role picker so you don't have to type credentials for a demo.
export const DEMO_ACCOUNTS = {
  customer: { email: 'customer@example.com', password: 'Customer@123' },
  staff: { email: 'staff1@citycare.dev', password: 'Staff@123' },
  admin: { email: 'admin@citycare.dev', password: 'Admin@123' },
};

export const useSession = create<SessionState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.login(email, password);
      saveToken(token);
      set({ user: user as SessionUser, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed', loading: false });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null });
  },
}));
