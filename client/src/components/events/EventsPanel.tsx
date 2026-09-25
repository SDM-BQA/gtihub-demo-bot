import { api } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import type { EventsResponse, Repo } from '../../types';
import { EventRow } from './EventRow';

const REFRESH_MS = 5_000;

export function EventsPanel({ repo }: { repo: Repo }) {
  const { data, error } = usePolling(
    () => api.get<EventsResponse>(`/api/repos/${repo.id}/events`),
    REFRESH_MS,
    [repo.id],
  );

  return (
    <section className="card">
      <div className="row spread">
        <h2>Activity for {repo.fullName}</h2>
        <span className="muted small" title="Refreshes every 5 seconds while this tab is open">
          <span className={`dot ${error ? 'bad' : 'ok'}`} /> {error ? 'reconnecting…' : 'live'}
        </span>
      </div>

      {!data && !error && <p className="muted">Loading activity…</p>}
      {data?.events.length === 0 && (
        <p className="muted">No events yet. Open an issue or pull request in this repo and it will appear here.</p>
      )}

      <ul className="events">
        {data?.events.map((event) => <EventRow key={event.id} event={event} maxAttempts={data.maxAttempts} />)}
      </ul>
    </section>
  );
}
