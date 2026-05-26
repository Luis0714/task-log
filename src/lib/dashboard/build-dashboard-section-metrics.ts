import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
import {
  buildDashboardMetrics,
  resolveCurrentSprint,
} from "@/lib/dashboard/build-dashboard-metrics";
import {
  formatSprintDayShortLabel,
  isSameLocalDay,
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import type { DashboardMetrics } from "@/lib/dashboard/types";

export type DashboardSectionMetricsInput = {
  bundle: DashboardSprintBundle;
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export type DashboardSectionMetricsResult = {
  metrics: DashboardMetrics;
  effectiveSprintDayKey: string;
  hoursDayLabel: string;
};

export function buildDashboardSectionMetrics({
  bundle,
  catalog,
  sprintDayKey,
}: DashboardSectionMetricsInput): DashboardSectionMetricsResult {
  const currentSprint = resolveCurrentSprint(catalog);
  const sprintWorkingDays = listSprintWorkingDays(
    currentSprint?.startDate,
    currentSprint?.finishDate,
    { nonWorkingDates: new Set(bundle.nonWorkingDates) },
  );

  const effectiveSprintDayKey = resolveEffectiveSprintDayKey(
    sprintDayKey,
    sprintWorkingDays,
  );

  const { metrics } = buildDashboardMetrics({
    bundle,
    catalog,
    selectedSprintDayKey: effectiveSprintDayKey,
  });

  const selectedSprintDay =
    sprintWorkingDays.find((day) => day.value === effectiveSprintDayKey) ?? null;

  const hoursDayLabel = (() => {
    if (!selectedSprintDay) return "Horas del día";
    if (isSameLocalDay(selectedSprintDay.date, new Date())) return "Horas hoy";
    return `Horas ${formatSprintDayShortLabel(selectedSprintDay)}`;
  })();

  return { metrics, effectiveSprintDayKey, hoursDayLabel };
}

export function emptyDashboardBundle(
  overrides: Partial<DashboardSprintBundle> = {},
): DashboardSprintBundle {
  return {
    workItems: [],
    bugs: [],
    tasks: [],
    backlogStates: [],
    nonWorkingDates: [],
    error: null,
    ...overrides,
  };
}
