"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { SprintDaySelect } from "@/components/dashboard/sprint-day-select";
import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import {
  listSprintWorkingDays,
  pickDefaultSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardPageShellProps = {
  header: DashboardHeaderData;
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  initialSprintDayKey: string;
  nonWorkingDates: readonly string[];
  children?: ReactNode;
};

export function DashboardPageShell({
  header,
  catalog,
  adoExecutionReady,
  initialSprintDayKey,
  nonWorkingDates,
  children = null,
}: DashboardPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sprintDayKey, setSprintDayKey] = useState(initialSprintDayKey);

  useEffect(() => {
    setSprintDayKey(initialSprintDayKey);
  }, [initialSprintDayKey]);

  const context = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    sprintDay: sprintDayKey,
  });

  const currentSprint = useMemo(
    () => catalog.sprints.find((sprint) => sprint.path === catalog.sprintPath) ?? null,
    [catalog.sprintPath, catalog.sprints],
  );

  const resolvedHeader: DashboardHeaderData = useMemo(
    () => ({
      ...header,
      project: catalog.project || header.project,
      sprintName: currentSprint?.name ?? header.sprintName,
    }),
    [catalog.project, currentSprint?.name, header],
  );

  const sprintWorkingDays = useMemo(
    () =>
      listSprintWorkingDays(
        currentSprint?.startDate,
        currentSprint?.finishDate,
        { nonWorkingDates: new Set(nonWorkingDates) },
      ),
    [currentSprint?.finishDate, currentSprint?.startDate, nonWorkingDates],
  );

  useEffect(() => {
    if (sprintWorkingDays.length === 0) return;
    const defaultKey = pickDefaultSprintDayKey(sprintWorkingDays);
    if (!defaultKey) return;
    setSprintDayKey((current) => {
      const stillValid = sprintWorkingDays.some((day) => day.value === current);
      return stillValid ? current : defaultKey;
    });
  }, [catalog.sprintPath, sprintWorkingDays]);

  const catalogError =
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null;

  const onSprintDayChange = (value: string) => {
    setSprintDayKey(value);
    router.push(
      `${pathname}${buildAdoContextQuery({
        project: catalog.project,
        team: catalog.team,
        sprint: catalog.sprintPath,
        sprintDay: value,
      })}`,
    );
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <DashboardHeader data={resolvedHeader} />

      {!adoExecutionReady ? (
        <CopilotErrorAlert message="Conecta Azure DevOps para ver tu dashboard con datos reales." />
      ) : null}

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          className="max-w-3xl"
          context={{
            ...context,
            sprintDayFilter:
              sprintWorkingDays.length > 0 ? (
                <SprintDaySelect
                  showLabel
                  value={sprintDayKey}
                  workingDays={sprintWorkingDays}
                  className="w-full"
                  onValueChange={onSprintDayChange}
                />
              ) : null,
          }}
          defaultOpen={false}
          collapsibleTitle="Contexto"
        />
      ) : null}

      {children}
    </div>
  );
}
