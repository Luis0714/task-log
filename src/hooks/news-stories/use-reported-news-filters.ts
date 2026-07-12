"use client";

import { useCallback, useMemo, useState } from "react";

import type { ReportedNewsDateFilter } from "@/lib/azure-devops/list-reported-news";
import {
  currentMonthKey,
  type DateFilterMode,
} from "@/components/news-stories/news-stories-reported-format";

export type UseReportedNewsFiltersArgs = Readonly<{
  scopes: ReadonlyArray<unknown>;
}>;

export type UseReportedNewsFiltersResult = Readonly<{
  mode: DateFilterMode;
  setMode: (next: DateFilterMode) => void;

  monthKey: string;
  setMonthKey: (next: string) => void;

  rangeFrom: string;
  setRangeFrom: (next: string) => void;
  rangeTo: string;
  setRangeTo: (next: string) => void;

  assigneeQuery: string;
  setAssigneeQuery: (next: string) => void;

  dateFilter: ReportedNewsDateFilter | null;
}>;

/**
 * Encapsula el estado de filtros (periodo + asignado a) y la derivación del
 * `dateFilter` listo para pasar al hook `useReportedNewsStories`. El filtro
 * de "Asignado a" se aplica en cliente en la sección que llama — así el hook
 * se queda 100 % enfocado en el shape que el lib espera.
 */
export function useReportedNewsFilters(
  args: UseReportedNewsFiltersArgs,
): UseReportedNewsFiltersResult {
  const [mode, setMode] = useState<DateFilterMode>("month");
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");
  const [assigneeQuery, setAssigneeQuery] = useState<string>("");

  const scopesReady = args.scopes.length > 0;

  const dateFilter = useMemo<ReportedNewsDateFilter | null>(() => {
    if (!scopesReady) return null;
    if (mode === "month") {
      return monthKey ? { kind: "month", monthKey } : { kind: "none" };
    }
    if (mode === "range") {
      if (!rangeFrom || !rangeTo) return { kind: "none" };
      return { kind: "range", fromKey: rangeFrom, toKey: rangeTo };
    }
    return { kind: "none" };
  }, [scopesReady, mode, monthKey, rangeFrom, rangeTo]);

  const handleModeChange = useCallback((next: DateFilterMode) => {
    setMode(next);
    // Mantener `assigneeQuery` — la persona puede aparecer en otros meses.
  }, []);

  return {
    mode,
    setMode: handleModeChange,
    monthKey,
    setMonthKey,
    rangeFrom,
    setRangeFrom,
    rangeTo,
    setRangeTo,
    assigneeQuery,
    setAssigneeQuery,
    dateFilter,
  };
}
