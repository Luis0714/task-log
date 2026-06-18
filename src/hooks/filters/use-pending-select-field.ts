"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";

export type PendingSelectField = "project" | "team" | "sprint" | null;

export type UsePendingSelectFieldResult = {
  isPending: boolean;
  pendingField: PendingSelectField;
  runPending: <Args extends unknown[]>(
    field: Exclude<PendingSelectField, null>,
    work: (...args: Args) => void,
  ) => (...args: Args) => void;
};

/**
 * Encapsula un `useTransition` + un ref que indica qué select disparó
 * la navegación pendiente. Permite que el UI muestre spinner en cascada
 * (proyecto→equipo→sprint) hasta que el catálogo server se actualice.
 */
export function usePendingSelectField(): UsePendingSelectFieldResult {
  const [isPending, startTransition] = useTransition();
  const pendingFieldRef = useRef<PendingSelectField>(null);

  useEffect(() => {
    if (!isPending) {
      pendingFieldRef.current = null;
    }
  }, [isPending]);

  const runPending = useCallback(
    <Args extends unknown[]>(
      field: Exclude<PendingSelectField, null>,
      work: (...args: Args) => void,
    ) =>
      (...args: Args) => {
        pendingFieldRef.current = field;
        startTransition(() => work(...args));
      },
    [startTransition],
  );

  return {
    isPending,
    pendingField: pendingFieldRef.current,
    runPending,
  };
}
