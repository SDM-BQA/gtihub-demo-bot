import { useState, type FormEvent } from 'react';
import type { RuleInput, Trigger } from '../../types';
import { TRIGGER_LABELS } from '../../utils/rules';

type Props = {
  initial: RuleInput;
  submitLabel: string;
  onSubmit: (input: RuleInput) => Promise<void>;
  onCancel: () => void;
};

export function RuleForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<RuleInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // One setter for every field keeps the inputs below short.
  const set = <K extends keyof RuleInput>(key: K, value: RuleInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof RuleInput) => ({
    value: (form[key] as string | null) ?? '',
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  });

  // Pushes have no issue/PR to label or comment on.
  const isPush = form.trigger === 'PUSH';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(isPush ? { ...form, hasLabel: null, addLabel: null, comment: null } : form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the rule');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rule-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input required maxLength={100} placeholder="Triage bug reports" {...text('name')} />
      </label>

      <fieldset>
        <legend>When</legend>
        <select value={form.trigger} onChange={(e) => set('trigger', e.target.value as Trigger)}>
          {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="muted small">All filled-in conditions must match. Leave empty to match everything.</p>
        <label>
          {isPush ? 'Commit message contains' : 'Title contains'}
          <input maxLength={100} placeholder="bug" {...text('titleContains')} />
        </label>
        <label>
          Author (GitHub username)
          <input maxLength={39} placeholder="octocat" {...text('author')} />
        </label>
        {!isPush && (
          <label>
            Has label
            <input maxLength={50} placeholder="help wanted" {...text('hasLabel')} />
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend>Then</legend>
        {!isPush && (
          <>
            <label>
              Add label
              <input maxLength={50} placeholder="bug" {...text('addLabel')} />
            </label>
            <label>
              Post comment
              <textarea maxLength={2000} rows={3} placeholder="Thanks for the report! We'll take a look." {...text('comment')} />
            </label>
          </>
        )}
        <label className="check">
          <input type="checkbox" checked={form.notifySlack} onChange={(e) => set('notifySlack', e.target.checked)} />
          Send a Slack alert
        </label>
        <label className="check">
          <input type="checkbox" checked={form.aiSummary} onChange={(e) => set('aiSummary', e.target.checked)} />
          AI triage: one-line summary, priority and a suggested label (shown in Slack and the activity log)
        </label>
      </fieldset>

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="button" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
