"use client";

import type { ReactNode } from "react";

import { SprintTimesSection } from "@/components/sprints/stats/sprint-times-section";
import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import type { UseSprintStatsResult } from "@/hooks/sprints/use-sprint-stats";
import { EMPTY_SPRINT_TIMES_METRICS } from "@/lib/sprints/build-sprint-times-metrics";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";

export type ReportsTimeLogContentProps = {
  sprint: { name: string } | null;
  statsState: UseSprintStatsResult;
  shareScope?: SprintTimesShareScope;
  exportDialog?: ReactNode;
};

export function ReportsTimeLogContent({
  sprint,
  statsState,
  shareScope,
  exportDialog,
}: ReportsTimeLogContentProps) {
  if (!sprint) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecciona un proyecto, equipo y sprint para ver los tiempos registrados.
      </p>
    );
  }

  const times = statsState.stats?.times ?? EMPTY_SPRINT_TIMES_METRICS;

  return (
    <div className="flex flex-col gap-6">
      {statsState.error ? <CopilotErrorAlert message={statsState.error} /> : null}

      <SprintTimesSection
        times={times}
        loading={statsState.loading}
        shareScope={shareScope}
        extraAction={exportDialog}
      />
    </div>
  );
}
