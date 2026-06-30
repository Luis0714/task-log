"use client";

import { useEffect, useState } from "react";

export type TaskState = {
  name: string;
  color: string;
  category: string;
};

type State = {
  states: readonly TaskState[];
  loading: boolean;
};

export function useTaskStates(): State {
  const [states, setStates] = useState<readonly TaskState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ado/task-states")
      .then((res) => (res.ok ? res.json() as Promise<{ states: TaskState[] }> : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStates(data.states);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { states, loading };
}
