"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ConnectSignInTrigger } from "@/components/auth/connect-sign-in-trigger";
import { DashboardHeaderRow } from "@/components/dashboard/layout/dashboard-header-row";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { SprintDaySelect } from "@/components/filters/sprint-day-select";
import { useAdoContextPage } from "@/hooks/filters/use-ado-context-page";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import {
  listSprintWorkingDays,
  resolveEffectiveSprintDayKey,
} from "@/lib/dashboard/sprint-days";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardPageShellProps = {
  header: DashboardHeaderData;
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  userSessionActive: boolean;
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget: SavedConnectionTarget | null;
  initialSprintDayKey: string;
  nonWorkingDates: readonly string[];
  children?: ReactNode;
};

export function DashboardPageShell({
  header,
  catalog,
  adoExecutionReady,
  userSessionActive,
  connectOptions,
  savedConnectionTarget,
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

  const { context, catalogError } = useAdoContextPage({
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
    const resolved = resolveEffectiveSprintDayKey(sprintDayKey, sprintWorkingDays);
    if (resolved === sprintDayKey) return;

    setSprintDayKey(resolved);
    router.replace(
      `${pathname}${buildAdoContextQuery({
        project: catalog.project,
        team: catalog.team,
        sprint: catalog.sprintPath,
        sprintDay: resolved,
      })}`,
    );
  }, [
    catalog.project,
    catalog.sprintPath,
    catalog.team,
    pathname,
    router,
    sprintDayKey,
    sprintWorkingDays,
  ]);

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
      <DashboardHeaderRow
        data={resolvedHeader}
        actions={
          !userSessionActive ? (
            <ConnectSignInTrigger
              connectOptions={connectOptions}
              savedConnectionTarget={savedConnectionTarget}
            />
          ) : null
        }
      />

      {userSessionActive && catalogError ? (
        <CopilotErrorAlert message={catalogError} />
      ) : null}

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
