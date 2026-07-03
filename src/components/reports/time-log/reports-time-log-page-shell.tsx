"use client";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { ReportsTimeLogContent } from "@/components/reports/time-log/reports-time-log-content";
import { ReportsTimeLogExportDialog } from "@/components/reports/time-log/reports-time-log-export-dialog";
import { useSprintStats } from "@/hooks/sprints/use-sprint-stats";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import { EMPTY_SPRINT_TIMES_METRICS } from "@/lib/sprints/build-sprint-times-metrics";
import { PAGE_SEO } from "@/lib/seo/pages";

export type ReportsTimeLogPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
};

export function ReportsTimeLogPageShell({
  catalog,
  adoExecutionReady,
}: ReportsTimeLogPageShellProps) {
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

  const exportDialog = currentSprint ? (
    <ReportsTimeLogExportDialog
      project={catalog.project}
      team={catalog.team}
      sprint={currentSprint}
      times={times}
      disabled={statsState.loading || !statsState.stats}
    />
  ) : null;

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
      />
    </AdoContextPageShell>
  );
}
