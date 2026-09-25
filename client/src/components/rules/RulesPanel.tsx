import { useState } from 'react';
import type { Repo, RuleInput } from '../../types';
import { useRules } from '../../hooks/useRules';
import { EMPTY_RULE, toRuleInput } from '../../utils/rules';
import { RuleCard } from './RuleCard';
import { RuleForm } from './RuleForm';

// Which form is open: none, the "new rule" form, or the edit form of one rule.
type Editing = null | 'new' | number;

export function RulesPanel({ repo }: { repo: Repo }) {
  const { rules, loading, error, create, update, remove } = useRules(repo.id);
  const [editing, setEditing] = useState<Editing>(null);

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete rule "${name}"?`)) return;
    await remove(id);
  }

  return (
    <section className="card">
      <div className="row spread">
        <h2>Rules for {repo.fullName}</h2>
        {editing === null && (
          <button className="button" onClick={() => setEditing('new')}>
            New rule
          </button>
        )}
      </div>

      {editing === 'new' && (
        <RuleForm
          initial={EMPTY_RULE}
          submitLabel="Create rule"
          onSubmit={async (input: RuleInput) => {
            await create(input);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && <p className="muted">Loading rules…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && rules.length === 0 && editing !== 'new' && (
        <p className="muted">No rules yet. Events from this repo are recorded but the bot won't act on them.</p>
      )}

      <ul className="rules">
        {rules.map((rule) =>
          editing === rule.id ? (
            <li key={rule.id}>
              <RuleForm
                initial={toRuleInput(rule)}
                submitLabel="Save changes"
                onSubmit={async (input) => {
                  await update(rule.id, input);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => update(rule.id, { ...toRuleInput(rule), enabled: !rule.enabled })}
              onEdit={() => setEditing(rule.id)}
              onDelete={() => handleDelete(rule.id, rule.name)}
            />
          ),
        )}
      </ul>
    </section>
  );
}
