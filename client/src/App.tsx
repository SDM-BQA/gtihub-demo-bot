import { useEffect, useState } from 'react';
import { api, ApiError } from './api/client';
import type { Me } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

type AuthState = { status: 'loading' } | { status: 'guest' } | { status: 'signedIn'; me: Me } | { status: 'error' };

export function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    api
      .get<Me>('/api/me')
      .then((me) => setAuth({ status: 'signedIn', me }))
      .catch((err) => setAuth(err instanceof ApiError && err.status === 401 ? { status: 'guest' } : { status: 'error' }));
  }, []);

  if (auth.status === 'loading') return <p className="center muted">Loading…</p>;
  if (auth.status === 'error') return <p className="center">Something went wrong. Please refresh.</p>;
  if (auth.status === 'guest') return <LoginPage />;
  return <DashboardPage me={auth.me} />;
}
