import type { Rule } from '../../types';
import { describeRule } from '../../utils/rules';

type Props = {
  rule: Rule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RuleCard({ rule, onToggle, onEdit, onDelete }: Props) {
  const { when, then } = describeRule(rule);

  return (
    <li className={`rule ${rule.enabled ? '' : 'disabled'}`}>
      <div>
        <strong>{rule.name}</strong>
        <div className="muted small">
          <b>When</b> {when} <b>→</b> {then}
        </div>
      </div>
      <div className="row">
        <label className="check small">
          <input type="checkbox" checked={rule.enabled} onChange={onToggle} />
          Enabled
        </label>
        <button className="link" onClick={onEdit}>
          Edit
        </button>
        <button className="link danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}
