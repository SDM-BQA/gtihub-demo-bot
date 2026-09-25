import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Rule, RuleInput } from '../types';

// Loads a repo's rules and keeps the list in sync after create/update/delete (no refetch needed).
export function useRules(repoId: number) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // ignore a slow response if the user already switched to another repo
    setLoading(true);
    setError(null);
    api
      .get<Rule[]>(`/api/repos/${repoId}/rules`)
      .then((data) => !cancelled && setRules(data))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [repoId]);

  async function create(input: RuleInput) {
    const rule = await api.post<Rule>(`/api/repos/${repoId}/rules`, input);
    setRules((list) => [...list, rule]);
  }

  async function update(id: number, input: RuleInput) {
    const rule = await api.put<Rule>(`/api/rules/${id}`, input);
    setRules((list) => list.map((r) => (r.id === id ? rule : r)));
  }

  async function remove(id: number) {
    await api.delete(`/api/rules/${id}`);
    setRules((list) => list.filter((r) => r.id !== id));
  }

  return { rules, loading, error, create, update, remove };
}
