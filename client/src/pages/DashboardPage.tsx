import { useState } from 'react';
import type { Me } from '../types';
import { Header } from '../components/Header';
import { RepoList } from '../components/RepoList';
import { RulesPanel } from '../components/rules/RulesPanel';

export function DashboardPage({ me }: { me: Me }) {
  const [selectedId, setSelectedId] = useState<number | null>(me.repos[0]?.id ?? null);
  const selectedRepo = me.repos.find((r) => r.id === selectedId);

  return (
    <>
      <Header user={me.user} />
      <main className="layout">
        <aside>
          <RepoList repos={me.repos} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
        <div className="stack">
          {selectedRepo ? (
            <RulesPanel key={selectedRepo.id} repo={selectedRepo} />
          ) : (
            <section className="card muted">Connect a repository to start adding rules.</section>
          )}
        </div>
      </main>
    </>
  );
}
