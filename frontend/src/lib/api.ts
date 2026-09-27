// Every backend call goes through this file. Pages import functions from
// here instead of calling fetch() directly, so there's exactly one place
// that knows the API's base URL, how auth headers are attached, and how
// errors are shaped.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('queueflow_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });

// ---- Auth ----
export const api = {
  login: (email: string, password: string) =>
    post<{ token: string; user: { id: string; email: string; fullName: string; role: string } }>('/api/auth/login', { email, password }),

  // ---- Organizations / branches / services ----
  getOrganizations: () => get<{ id: string; name: string; slug: string; description: string }[]>('/api/organizations'),
  getBranches: (orgId: string) => get<{ id: string; name: string; address: string }[]>(`/api/organizations/${orgId}/branches`),
  getBranch: (branchId: string) => get<{ id: string; name: string; address: string; organizationId: string }>(`/api/branches/${branchId}`),
  getServices: (branchId: string) => get<{ id: string; name: string; description: string; estimatedDuration: number }[]>(`/api/branches/${branchId}/services`),
  getOrgServices: (orgId: string) => get<any[]>(`/api/organizations/${orgId}/services`),
  getService: (serviceId: string) => get<{ id: string; name: string; description: string; estimatedDuration: number }>(`/api/services/${serviceId}`),

  // ---- Counters ----
  getCounters: (branchId: string) => get<any[]>(`/api/branches/${branchId}/counters`),
  setCounterStatus: (counterId: string, status: string) => patch<any>(`/api/counters/${counterId}/status`, { status }),

  // ---- Queue ----
  listQueueEntries: (params: { branchId?: string; serviceId?: string; customerName?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get<any[]>(`/api/queue?${q}`);
  },
  joinQueue: (data: { branchId: string; serviceId: string; customerName: string; type: 'WALK_IN' | 'VIRTUAL' }) =>
    post<any>('/api/queue/join', data),
  getQueueEntry: (id: string) => get<{ entry: any; peopleAhead: number; estimatedWaitMinutes: number; currentlyServing: any }>(`/api/queue/${id}`),
  cancelQueueEntry: (id: string) => post<any>(`/api/queue/${id}/cancel`),
  callNext: (counterId: string) => post<any>(`/api/queue/counters/${counterId}/call-next`),
  startService: (id: string) => post<any>(`/api/queue/${id}/start`),
  completeService: (id: string) => post<any>(`/api/queue/${id}/complete`),
  skipEntry: (id: string) => post<any>(`/api/queue/${id}/skip`),
  recallEntry: (id: string) => post<any>(`/api/queue/${id}/recall`),

  // ---- Appointments ----
  bookAppointment: (data: { branchId: string; serviceId: string; customerName: string; scheduledAt: string }) =>
    post<any>('/api/appointments', data),
  listAppointments: (customerName: string) => get<any[]>(`/api/appointments?customerName=${encodeURIComponent(customerName)}`),
  cancelAppointment: (id: string) => post<any>(`/api/appointments/${id}/cancel`),

  // ---- Admin ----
  getDashboard: () => get<any>('/api/admin/dashboard'),
  getAuditLog: () => get<any[]>('/api/admin/audit-log'),
};

export function saveToken(token: string) {
  localStorage.setItem('queueflow_token', token);
}
export function clearToken() {
  localStorage.removeItem('queueflow_token');
}
