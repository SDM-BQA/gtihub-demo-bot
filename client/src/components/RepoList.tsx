import type { Repo } from '../types';

export function RepoList({ repos }: { repos: Repo[] }) {
  return (
    <section className="card">
      <div className="row spread">
        <h2>Connected repositories</h2>
        <div className="row">
          {/* Re-runs sign-in: GitHub bounces straight back (already authorized) and the callback re-syncs repos.
              Needed after changing repos on GitHub's own settings page, which doesn't redirect back to us. */}
          <a href="/auth/github/login">Refresh</a>
          {/* First install: GitHub redirects back to our callback. Already installed: GitHub opens its settings page. */}
          <a className="button" href="/auth/github/install">
            Connect repositories
          </a>
        </div>
      </div>

      {repos.length === 0 ? (
        <p className="muted">No repositories connected yet.</p>
      ) : (
        <ul className="list">
          {repos.map((repo) => (
            <li key={repo.id}>
              <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noreferrer">
                {repo.fullName}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
