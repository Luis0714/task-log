"use client";

import { useMemo } from "react";

import { computeHoursReportDisplayFlags } from "@/hooks/reports/use-hours-report-display-flags";
import type { UseHoursReportReturn } from "@/hooks/reports/use-hours-report";
import { filterHoursReportByVisibility } from "@/lib/reports/hours/filter-hours-report-by-visibility";
import { filterHoursReportRowsByName } from "@/lib/reports/hours/filter-hours-report-rows-by-name";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";
import { uniquePersonDisplayNames } from "@/lib/reports/hours/unique-person-display-names";

export type UseHoursReportViewParams = Readonly<{
  hoursReport: UseHoursReportReturn;
  hiddenPersons: ReadonlySet<string>;
  nameFilter: string;
}>;

export type UseHoursReportViewReturn = Readonly<{
  allRows: HoursReportRow[];
  allPersons: string[];
  filteredRows: HoursReportRow[];
  showStale: boolean;
  showError: boolean;
  showEmpty: boolean;
  showExport: boolean;
}>;

/**
 * Deriva las filas/flags visibles a partir del reporte + visibilidad + filtro
 * por nombre. Encapsula la cadena de filtrado para que el componente solo
 * consuma el resultado y pinte la tabla/alerts.
 */
export function useHoursReportView({
  hoursReport,
  hiddenPersons,
  nameFilter,
}: UseHoursReportViewParams): UseHoursReportViewReturn {
  const allRows = useMemo(
    () => hoursReport.result?.rows ?? [],
    [hoursReport.result],
  );

  const allPersons = useMemo(
    () => uniquePersonDisplayNames(allRows),
    [allRows],
  );

  const visibleRows = useMemo(
    () =>
      hoursReport.result
        ? filterHoursReportByVisibility(hoursReport.result, hiddenPersons).rows
        : [],
    [hoursReport.result, hiddenPersons],
  );

  const filteredRows = useMemo(
    () => filterHoursReportRowsByName(visibleRows, nameFilter),
    [visibleRows, nameFilter],
  );

  const { showStale, showError, showEmpty, showExport } = useMemo(
    () => computeHoursReportDisplayFlags(hoursReport),
    [hoursReport],
  );

  return {
    allRows,
    allPersons,
    filteredRows,
    showStale,
    showError,
    showEmpty,
    showExport,
  };
}