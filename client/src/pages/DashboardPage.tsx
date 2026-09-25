import { useState } from 'react';
import type { Me } from '../types';
import { Header } from '../components/Header';
import { RepoList } from '../components/RepoList';
import { RulesPanel } from '../components/rules/RulesPanel';
import { EventsPanel } from '../components/events/EventsPanel';

type Tab = 'activity' | 'rules';

export function DashboardPage({ me }: { me: Me }) {
  const [selectedId, setSelectedId] = useState<number | null>(me.repos[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>('activity');
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
            <>
              <nav className="tabs">
                <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>
                  Activity
                </button>
                <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>
                  Rules
                </button>
              </nav>
              {tab === 'activity' ? (
                <EventsPanel key={selectedRepo.id} repo={selectedRepo} />
              ) : (
                <RulesPanel key={selectedRepo.id} repo={selectedRepo} />
              )}
            </>
          ) : (
            <section className="card muted">Connect a repository to start adding rules.</section>
          )}
        </div>
      </main>
    </>
  );
}
