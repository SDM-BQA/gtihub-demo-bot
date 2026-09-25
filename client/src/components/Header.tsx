import { api } from '../api/client';
import type { Me } from '../types';

export function Header({ user }: { user: Me['user'] }) {
  async function logout() {
    await api.post('/auth/logout');
    window.location.href = '/';
  }

  return (
    <header className="header">
      <strong>GitHub Automation Bot</strong>
      <div className="row">
        {user.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" />}
        <span>{user.login}</span>
        <button className="link" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
