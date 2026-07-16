"use client";

import { useCallback, useMemo, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import {
  pruneTeamSelection,
  teamNamesForProjects,
  teamsForProjects,
} from "@/lib/filters/teams-by-project";
import { buildHoursReportPayload } from "@/lib/reports/hours/build-hours-report-payload";
import type {
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import type { UseHoursReportReturn } from "@/hooks/reports/use-hours-report";

export type UseHoursReportFiltersParams = Readonly<{
  catalog: AdoCatalogSnapshot;
  initialScopes: { projectIds: string[]; teamIds: string[] };
  /**
   * Hook del reporte. Se usa para invocar `markStale` con el payload NUEVO
   * cada vez que cambian los filtros. Si se omite, los cambios no marcan
   * stale (útil en tests).
   */
  hoursReport?: Pick<UseHoursReportReturn, "markStale">;
}>;

export type UseHoursReportFiltersReturn = Readonly<{
  period: HoursReportPeriodSchema;
  year: number;
  monthKey: string;
  rangeFrom: string;
  rangeTo: string;
  projectIds: string[];
  teamIds: string[];
  teams: ReturnType<typeof teamsForProjects>;
  nameFilter: string;
  payload: HoursReportRequestSchema;
  onPeriodChange: (kind: HoursReportPeriodSchema["kind"]) => void;
  onYearChange: (y: number) => void;
  onMonthKeyChange: (k: string) => void;
  onRangeFromChange: (iso: string) => void;
  onRangeToChange: (iso: string) => void;
  onProjectIdsChange: (ids: string[]) => void;
  onTeamIdsChange: (ids: string[]) => void;
  onNameFilterChange: (value: string) => void;
}>;

function defaultPeriod(): HoursReportPeriodSchema {
  const todayKey = getTodayDateKey();
  return { kind: "month", monthKey: todayKey.slice(0, 7) };
}

function defaultMonthKey(): string {
  const p = defaultPeriod();
  return p.kind === "month" ? p.monthKey : "";
}

export function useHoursReportFilters({
  catalog,
  initialScopes,
  hoursReport,
}: UseHoursReportFiltersParams): UseHoursReportFiltersReturn {
  const [period, setPeriod] = useState<HoursReportPeriodSchema>(defaultPeriod());
  const [rangeFrom, setRangeFrom] = useState<string>(getTodayDateKey());
  const [rangeTo, setRangeTo] = useState<string>(getTodayDateKey());
  const [projectIds, setProjectIds] = useState<string[]>(initialScopes.projectIds);
  const [teamIds, setTeamIds] = useState<string[]>(initialScopes.teamIds);
  const [nameFilter, setNameFilter] = useState<string>("");

  const allProjectNames = useMemo(
    () => catalog.projects.map((p) => p.name),
    [catalog.projects],
  );

  const teams = useMemo(
    () => teamsForProjects(catalog.teamsByProject, projectIds),
    [catalog.teamsByProject, projectIds],
  );

  /**
   * Construye el payload del reporte. Acepta overrides para que los handlers
   * de filtros (projects/teams/period) puedan pasar el valor NUEVO
   * directamente al `markStale`. Si no se pasa override, usa el estado actual
   * capturado en el closure — importante para que `markStale` detecte cambios
   * de projects/teams (antes el closure tenía los IDs viejos y nunca marcaba
   * stale al cambiar un proyecto o equipo).
   */
  const buildPayload = useCallback(
    (next?: {
      period?: HoursReportPeriodSchema;
      projectIds?: string[];
      teamIds?: string[];
    }): HoursReportRequestSchema => {
      const periodValue = next?.period ?? period;
      const projectIdsValue = next?.projectIds ?? projectIds;
      const teamIdsValue = next?.teamIds ?? teamIds;
      return buildHoursReportPayload({
        period: periodValue,
        projectIds: projectIdsValue,
        teamIds: teamIdsValue,
        allProjectNames,
        teamsByProject: catalog.teamsByProject,
      });
    },
    [period, projectIds, teamIds, allProjectNames, catalog.teamsByProject],
  );

  const payload = useMemo(() => buildPayload(), [buildPayload]);

  const markStaleNow = useCallback(
    (next?: {
      period?: HoursReportPeriodSchema;
      projectIds?: string[];
      teamIds?: string[];
    }) => {
      hoursReport?.markStale(buildPayload(next));
    },
    [hoursReport, buildPayload],
  );

  const switchToMonth = useCallback(() => {
    const next: HoursReportPeriodSchema = {
      kind: "month",
      monthKey: defaultMonthKey(),
    };
    setPeriod(next);
    markStaleNow({ period: next });
  }, [markStaleNow]);

  const switchToRange = useCallback(() => {
    const next: HoursReportPeriodSchema = {
      kind: "range",
      fromIso: rangeFrom,
      toIso: rangeTo,
    };
    setPeriod(next);
    markStaleNow({ period: next });
  }, [rangeFrom, rangeTo, markStaleNow]);

  const onPeriodChange = useCallback(
    (kind: HoursReportPeriodSchema["kind"]) => {
      if (kind === "month") switchToMonth();
      else switchToRange();
    },
    [switchToMonth, switchToRange],
  );

  const onYearChange = useCallback(
    (y: number) => {
      if (period.kind !== "month") return;
      const next: HoursReportPeriodSchema = {
        kind: "month",
        monthKey: `${y}-${period.monthKey.slice(5, 7)}`,
      };
      setPeriod(next);
      markStaleNow({ period: next });
    },
    [period, markStaleNow],
  );

  const onMonthKeyChange = useCallback(
    (k: string) => {
      const next: HoursReportPeriodSchema = { kind: "month", monthKey: k };
      setPeriod(next);
      markStaleNow({ period: next });
    },
    [markStaleNow],
  );

  const onRangeFromChange = useCallback(
    (iso: string) => {
      setRangeFrom(iso);
      const next: HoursReportPeriodSchema =
        period.kind === "range"
          ? { kind: "range", fromIso: iso, toIso: period.toIso }
          : period;
      setPeriod(next);
      markStaleNow({ period: next });
    },
    [period, markStaleNow],
  );

  const onRangeToChange = useCallback(
    (iso: string) => {
      setRangeTo(iso);
      const next: HoursReportPeriodSchema =
        period.kind === "range"
          ? { kind: "range", fromIso: period.fromIso, toIso: iso }
          : period;
      setPeriod(next);
      markStaleNow({ period: next });
    },
    [period, markStaleNow],
  );

  const onProjectIdsChange = useCallback(
    (ids: string[]) => {
      const prunedTeamIds = pruneTeamSelection(
        teamIds,
        teamNamesForProjects(catalog.teamsByProject, ids),
      );
      setProjectIds(ids);
      setTeamIds(prunedTeamIds);
      markStaleNow({ projectIds: ids, teamIds: prunedTeamIds });
    },
    [markStaleNow, teamIds, catalog.teamsByProject],
  );

  const onTeamIdsChange = useCallback(
    (ids: string[]) => {
      setTeamIds(ids);
      markStaleNow({ teamIds: ids });
    },
    [markStaleNow],
  );

  const onNameFilterChange = useCallback((value: string) => {
    setNameFilter(value);
  }, []);

  const year =
    period.kind === "month"
      ? Number(period.monthKey.slice(0, 4))
      : Number(getTodayDateKey().slice(0, 4));
  const monthKey =
    period.kind === "month" ? period.monthKey : `${year}-01`;

  return {
    period,
    year,
    monthKey,
    rangeFrom,
    rangeTo,
    projectIds,
    teamIds,
    teams,
    nameFilter,
    payload,
    onPeriodChange,
    onYearChange,
    onMonthKeyChange,
    onRangeFromChange,
    onRangeToChange,
    onProjectIdsChange,
    onTeamIdsChange,
    onNameFilterChange,
  };
}