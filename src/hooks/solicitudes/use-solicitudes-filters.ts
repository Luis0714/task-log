"use client";

import { useCallback, useMemo, useState } from "react";

import { currentMonthKey, type DateFilterMode } from "@/components/news-stories/news-stories-reported-format";
import type { ReportedNewsDateFilter } from "@/lib/azure-devops/list-reported-news";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";

export type UseSolicitudesFiltersResult = Readonly<{
  mode: DateFilterMode;
  setMode: (next: DateFilterMode) => void;

  monthKey: string;
  setMonthKey: (next: string) => void;

  rangeFrom: string;
  setRangeFrom: (next: string) => void;
  rangeTo: string;
  setRangeTo: (next: string) => void;

  assigneeFilter: string;
  setAssigneeFilter: (next: string) => void;

  /** Filtro de fecha listo para enviar al backend, o `null` si no hay scopes. */
  dateFilter: ReportedNewsDateFilter | null;
}>;

/**
 * Estado de filtros de la pantalla "Solicitudes y Novedades":
 * - Periodo (`mode`/`monthKey`/`rangeFrom`/`rangeTo`).
 * - Asignación (`assigneeFilter`, mismo formato que el resto del módulo).
 *
 * Defaults alineados con el resto de la plataforma:
 * - `mode = "month"`, `monthKey = currentMonthKey()`.
 * - `rangeFrom = rangeTo = getTodayDateKey()` (cuando se cambia a "range").
 * - `assigneeFilter = "me"` (se sobreescribe server-side para no-admin).
 *
 * El shell usa este hook + un `useEffect` para re-fetchear al cambiar
 * cualquiera de los campos, igual que `useReportedNewsStories` en el módulo
 * admin.
 */
export function useSolicitudesFilters(): UseSolicitudesFiltersResult {
  const [mode, setMode] = useState<DateFilterMode>("month");
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [rangeFrom, setRangeFrom] = useState<string>(getTodayDateKey());
  const [rangeTo, setRangeTo] = useState<string>(getTodayDateKey());
  const [assigneeFilter, setAssigneeFilter] = useState<string>("me");

  const dateFilter = useMemo<ReportedNewsDateFilter | null>(() => {
    if (mode === "month") {
      return monthKey ? { kind: "month", monthKey } : { kind: "none" };
    }
    if (mode === "range") {
      if (!rangeFrom || !rangeTo) return { kind: "none" };
      return { kind: "range", fromKey: rangeFrom, toKey: rangeTo };
    }
    return { kind: "none" };
  }, [mode, monthKey, rangeFrom, rangeTo]);

  const handleModeChange = useCallback((next: DateFilterMode) => {
    setMode(next);
    if (next === "range") {
      const today = getTodayDateKey();
      setRangeFrom((prev) => prev || today);
      setRangeTo((prev) => prev || today);
    }
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
    assigneeFilter,
    setAssigneeFilter,
    dateFilter,
  };
}
