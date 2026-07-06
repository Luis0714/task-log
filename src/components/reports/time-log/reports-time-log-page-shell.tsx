"use client";

import { useMemo } from "react";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { ReportsTimeLogContent } from "@/components/reports/time-log/reports-time-log-content";
import { ReportsTimeLogExportDialog } from "@/components/reports/time-log/reports-time-log-export-dialog";
import { useSprintStats } from "@/hooks/sprints/use-sprint-stats";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import { EMPTY_SPRINT_TIMES_METRICS } from "@/lib/sprints/build-sprint-times-metrics";
import { filterSprintTimesByVisibility } from "@/lib/sprints/filter-sprint-times-by-visibility";
import { PAGE_SEO } from "@/lib/seo/pages";
import { useAssigneeVisibilityStore } from "@/store/assignee-visibility-store";

export type ReportsTimeLogPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
};

export function ReportsTimeLogPageShell({
  catalog,
  adoExecutionReady,
}: Readonly<ReportsTimeLogPageShellProps>) {
  const currentSprint = resolveCurrentSprint(catalog);

  const statsState = useSprintStats({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    sprintStartDate: currentSprint?.startDate,
    sprintFinishDate: currentSprint?.finishDate,
    enabled: Boolean(currentSprint),
  });

  const times = statsState.stats?.times ?? EMPTY_SPRINT_TIMES_METRICS;
  const hidden = useAssigneeVisibilityStore((s) => s.hidden);
  const allAssignees = useMemo(
    () => times.rows.map((row) => row.assignee),
    [times.rows],
  );
  const visibleTimes = useMemo(
    () => filterSprintTimesByVisibility(times, hidden),
    [times, hidden],
  );

  const shareScope = currentSprint
    ? {
        project: catalog.project,
        team: catalog.team,
        sprintPath: catalog.sprintPath ?? "",
        sprintName: currentSprint.name,
        sprintStartDate: currentSprint.startDate,
        sprintFinishDate: currentSprint.finishDate,
        goalOnly: false,
      }
    : undefined;

  const exportDialog = (
    <ReportsTimeLogExportDialog
      project={catalog.project}
      team={catalog.team}
      availableSprints={catalog.sprints}
      activeSprintWeeks={times.weeks}
      initialSprintPath={currentSprint?.path}
      hiddenAssignees={Array.from(hidden)}
      disabled={statsState.loading || !statsState.stats}
    />
  );

  return (
    <AdoContextPageShell
      title={PAGE_SEO.reportsTimeLog.title}
      description={PAGE_SEO.reportsTimeLog.description}
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
    >
      <ReportsTimeLogContent
        sprint={currentSprint}
        statsState={statsState}
        shareScope={shareScope}
        exportDialog={exportDialog}
        allAssignees={allAssignees}
        visibleTimes={visibleTimes}
      />
    </AdoContextPageShell>
  );
}
