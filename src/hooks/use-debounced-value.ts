"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `value` después de `delayMs` sin cambios. Útil para disparar
 * búsquedas a APIs (Azure, WIQL, etc.) sin saturarlas en cada keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}