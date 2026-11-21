import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AccountUser = {
  id: string;
  username: string;
  email: string;
  inviteCode: string;
  createdAt: string;
};

export type CoinPackage = {
  id: string;
  coins: number;
  price: number;
  label: string;
};

export type CoinOrder = {
  id: string;
  coins: number;
  price: number;
  label: string;
  status: string;
  at: string;
};

export type PendingMail = {
  pending: true;
  email: string;
  mailed: boolean;
  activatePath?: string;
  mailError?: string;
  code?: string;
};

export type Session = {
  user: AccountUser | null;
  balance: number;
  checkedInToday: boolean;
  invited: { username: string; at: string }[];
  unlocks: string[];
  costs: Record<string, number>;
  rewards: { register: number; invitee: number; inviter: number; checkin: number };
  packages: CoinPackage[];
  orders: CoinOrder[];
  ledger: { delta: number; reason: string; at: string }[];
};

type AuthValue = {
  session: Session | null;
  ready: boolean;
  offline: boolean;
  refresh: () => Promise<void>;
  register: (input: { username: string; password: string; email: string; inviteCode?: string }) => Promise<PendingMail>;
  resend: (email: string) => Promise<PendingMail>;
  verify: (input: { email: string; code: string }) => Promise<void>;
  activate: (token: string) => Promise<void>;
  login: (input: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkin: () => Promise<void>;
  unlock: (feature: string) => Promise<void>;
  createOrder: (packageId: string) => Promise<CoinOrder>;
  payOrder: (orderId: string) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '请求失败');
  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  async function refresh() {
    try {
      setSession(await request<Session>('/api/me'));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, []);

  async function register(input: { username: string; password: string; email: string; inviteCode?: string }) {
    const pending = await request<PendingMail>('/api/auth/register', input);
    setOffline(false);
    return pending;
  }

  async function resend(email: string) {
    return request<PendingMail>('/api/auth/resend', { email });
  }

  async function verify(input: { email: string; code: string }) {
    setSession(await request<Session>('/api/auth/verify', input));
    setOffline(false);
  }

  async function activate(token: string) {
    setSession(await request<Session>('/api/auth/activate', { token }));
    setOffline(false);
  }

  async function login(input: { username: string; password: string }) {
    setSession(await request<Session>('/api/auth/login', input));
    setOffline(false);
  }

  async function logout() {
    setSession(await request<Session>('/api/auth/logout', {}));
  }

  async function checkin() {
    setSession(await request<Session>('/api/checkin', {}));
  }

  async function unlock(feature: string) {
    setSession(await request<Session>('/api/unlock', { feature }));
  }

  async function createOrder(packageId: string) {
    return request<CoinOrder>('/api/orders', { packageId });
  }

  async function payOrder(orderId: string) {
    setSession(await request<Session>('/api/orders/pay', { orderId }));
  }

  return (
    <AuthContext.Provider value={{ session, ready, offline, refresh, register, resend, verify, activate, login, logout, checkin, unlock, createOrder, payOrder }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('账户尚未接上');
  return value;
}
