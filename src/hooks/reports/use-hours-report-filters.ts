"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  HoursReportExcelQuerySchema,
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
  HoursReportScopeSchema,
} from "@/lib/schemas/reports-hours";

export type HoursReportFiltersState = {
  period: HoursReportPeriodSchema;
  scopes: HoursReportScopeSchema;
  personAdoId?: string;
  roleId?: string;
};

export type UseHoursReportFiltersReturn = {
  filters: HoursReportFiltersState;
  setPeriod: (period: HoursReportPeriodSchema) => void;
  setProjectIds: (ids: string[]) => void;
  setTeamIds: (ids: string[]) => void;
  setPersonAdoId: (id: string | undefined) => void;
  setRoleId: (id: string | undefined) => void;
  toRequestPayload: () => HoursReportRequestSchema;
  toExcelQuery: () => HoursReportExcelQuerySchema;
};

export function useHoursReportFilters(
  initial: HoursReportFiltersState,
): UseHoursReportFiltersReturn {
  const [filters, setFilters] = useState<HoursReportFiltersState>(initial);

  const setPeriod = useCallback((period: HoursReportPeriodSchema) => {
    setFilters((prev) => ({ ...prev, period }));
  }, []);

  const setProjectIds = useCallback((projectIds: string[]) => {
    setFilters((prev) => ({ ...prev, scopes: { ...prev.scopes, projectIds } }));
  }, []);

  const setTeamIds = useCallback((teamIds: string[]) => {
    setFilters((prev) => ({ ...prev, scopes: { ...prev.scopes, teamIds } }));
  }, []);

  const setPersonAdoId = useCallback((personAdoId: string | undefined) => {
    setFilters((prev) => ({ ...prev, personAdoId }));
  }, []);

  const setRoleId = useCallback((roleId: string | undefined) => {
    setFilters((prev) => ({ ...prev, roleId }));
  }, []);

  const toRequestPayload = useCallback(
    (): HoursReportRequestSchema => ({
      period: filters.period,
      scopes: filters.scopes,
      personAdoId: filters.personAdoId,
      roleId: filters.roleId,
    }),
    [filters],
  );

  const toExcelQuery = useCallback(
    (): HoursReportExcelQuerySchema => ({
      periodKind: filters.period.kind,
      monthKey: filters.period.kind === "month" ? filters.period.monthKey : undefined,
      fromIso: filters.period.kind === "range" ? filters.period.fromIso : undefined,
      toIso: filters.period.kind === "range" ? filters.period.toIso : undefined,
      projectIds: filters.scopes.projectIds,
      teamIds: filters.scopes.teamIds,
      personAdoId: filters.personAdoId,
      roleId: filters.roleId,
    }),
    [filters],
  );

  return useMemo(
    () => ({
      filters,
      setPeriod,
      setProjectIds,
      setTeamIds,
      setPersonAdoId,
      setRoleId,
      toRequestPayload,
      toExcelQuery,
    }),
    [filters, setPeriod, setProjectIds, setTeamIds, setPersonAdoId, setRoleId, toRequestPayload, toExcelQuery],
  );
}