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

/**
 * Estados de tareas (Task) del proyecto activo.
 *
 * Acepta `project` para que el endpoint devuelva los estados del proyecto
 * seleccionado, no del proyecto por defecto del caller. Si el proyecto
 * cambia, el hook refetchea automáticamente.
 */
export function useTaskStates(project?: string | null): State {
  const [states, setStates] = useState<readonly TaskState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const url = project
      ? `/api/ado/task-states?project=${encodeURIComponent(project)}`
      : "/api/ado/task-states";

    setLoading(true);
    fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<{ states: TaskState[] }>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStates(data.states);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return { states, loading };
}