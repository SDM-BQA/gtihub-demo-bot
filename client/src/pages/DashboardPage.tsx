import type { Me } from '../types';
import { Header } from '../components/Header';
import { RepoList } from '../components/RepoList';

export function DashboardPage({ me }: { me: Me }) {
  return (
    <>
      <Header user={me.user} />
      <main className="container">
        <RepoList repos={me.repos} />
      </main>
    </>
  );
}
