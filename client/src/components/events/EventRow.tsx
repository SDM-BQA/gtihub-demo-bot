import type { BotEvent } from '../../types';
import { ACTION_LABELS, EVENT_LABELS, describeStatus } from '../../utils/events';
import { relativeTime } from '../../utils/time';

export function EventRow({ event, maxAttempts }: { event: BotEvent; maxAttempts: number }) {
  const status = describeStatus(event, maxAttempts);

  return (
    <li className="event">
      <div className="row spread">
        <div className="row">
          <span className={`badge ${status.tone}`}>{status.label}</span>
          <span className="muted small">{EVENT_LABELS[event.githubEvent] ?? event.githubEvent}</span>
          {event.url ? (
            <a href={event.url} target="_blank" rel="noreferrer">
              {event.title}
            </a>
          ) : (
            <span>{event.title}</span>
          )}
          {event.author && <span className="muted small">by {event.author}</span>}
        </div>
        <span className="muted small" title={new Date(event.receivedAt).toLocaleString()}>
          {relativeTime(event.receivedAt)}
        </span>
      </div>

      {status.hint && <div className="muted small">{status.hint}</div>}

      {event.aiSummary && (
        <div className="ai small">
          <b>AI</b> {event.aiPriority && <span className="badge muted">{event.aiPriority}</span>} {event.aiSummary}
          {event.aiLabel && <span className="muted"> · suggested label "{event.aiLabel}"</span>}
        </div>
      )}

      {event.actionLogs.length > 0 && (
        <ul className="actions">
          {event.actionLogs.map((a) => (
            <li key={a.id} className={a.status === 'SUCCESS' ? 'ok' : 'bad'}>
              {a.status === 'SUCCESS' ? '✓' : '✗'} <b>{ACTION_LABELS[a.type]}</b>
              <span className="muted"> · {a.rule?.name ?? 'deleted rule'}</span>
              {a.status === 'SUCCESS' ? ` · ${a.detail ?? ''}` : ` · ${a.error ?? 'failed'}`}
              {a.attempts > 1 && <span className="muted"> · {a.attempts} attempts</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
