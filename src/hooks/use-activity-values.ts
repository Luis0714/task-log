"use client";

import { useEffect, useState } from "react";

type State = {
  values: readonly string[];
  loading: boolean;
};

export function useActivityValues(): State {
  const [values, setValues] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ado/activity-values")
      .then((res) => (res.ok ? res.json() as Promise<{ values: string[] }> : null))
      .then((data) => {
        if (cancelled || !data) return;
        setValues(data.values);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { values, loading };
}
