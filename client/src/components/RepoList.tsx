import type { Repo } from '../types';

type Props = {
  repos: Repo[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function RepoList({ repos, selectedId, onSelect }: Props) {
  return (
    <section className="card">
      <h2>Repositories</h2>

      {repos.length === 0 ? (
        <p className="muted">No repositories connected yet.</p>
      ) : (
        <ul className="repo-list">
          {repos.map((repo) => (
            <li key={repo.id}>
              <button className={repo.id === selectedId ? 'repo active' : 'repo'} onClick={() => onSelect(repo.id)}>
                {repo.fullName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="stack">
        {/* First install: GitHub redirects back to our callback. Already installed: GitHub opens its settings page. */}
        <a className="button" href="/auth/github/install">
          Connect repositories
        </a>
        {/* Re-runs sign-in: GitHub bounces straight back (already authorized) and the callback re-syncs repos. */}
        <a className="small" href="/auth/github/login">
          Refresh list
        </a>
      </div>
    </section>
  );
}
