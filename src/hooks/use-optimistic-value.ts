"use client";

import { startTransition, useOptimistic } from "react";

export function useOptimisticValue<T>(value: T) {
  const [optimistic, setOptimistic] = useOptimistic(value);

  function commit(next: T, save: () => void) {
    startTransition(() => {
      setOptimistic(next);
      save();
    });
  }

  return [optimistic, commit] as const;
}
