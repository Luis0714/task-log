"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SprintGoalView } from "@/components/sprints/sprint-goal-view";
import {
  SprintGoalViewSkeleton,
  SprintSnapshotGoalViewSkeleton,
} from "@/components/sprints/sprint-goal-view-skeleton";
import { SprintSnapshotBanner } from "@/components/sprints/snapshot/sprint-snapshot-banner";
import { SprintSnapshotDashboardView } from "@/components/sprints/snapshot/sprint-snapshot-dashboard-view";
import { SprintSnapshotGoalView } from "@/components/sprints/snapshot/sprint-snapshot-goal-view";
import { SprintStatsDashboardView } from "@/components/sprints/sprint-stats-dashboard-view";
import { SprintStatsDashboardSkeleton } from "@/components/sprints/stats/sprint-stats-dashboard-skeleton";
import type { UseSprintGoalEditorResult } from "@/hooks/sprints/use-sprint-goal-editor";
import type { UseSprintSnapshotResult } from "@/hooks/sprints/use-sprint-snapshot";
import type { UseSprintStatsResult } from "@/hooks/sprints/use-sprint-stats";
import { useSprintViewUrl } from "@/hooks/sprints/use-sprint-view-url";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintViewId } from "@/lib/sprints/sprint-view";

const SPRINT_VIEW_ITEMS = [
  { value: "stats" as const, label: "Dashboard" },
  { value: "goal" as const, label: "Objetivo" },
] satisfies readonly { value: SprintViewId; label: string }[];

export type SprintsPageContentProps = {
  sprint: AdoSprintDto | null;
  project: string;
  team: string;
  goalEditor: UseSprintGoalEditorResult;
  snapshotState: UseSprintSnapshotResult;
  statsState: UseSprintStatsResult;
};

export function SprintsPageContent({
  sprint,
  project,
  team,
  goalEditor,
  snapshotState,
  statsState,
}: SprintsPageContentProps) {
  const { view, setView } = useSprintViewUrl();

  if (!sprint) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecciona un proyecto, equipo y sprint para ver el análisis.
      </p>
    );
  }

  const showSnapshotViews = snapshotState.isFinalized && snapshotState.snapshot !== null;

  return (
    <div className="flex flex-col gap-6">
      <SprintSnapshotBanner
        snapshot={snapshotState.snapshot}
        isPastSprint={snapshotState.isPastSprint}
        loading={snapshotState.loading}
        finalizing={snapshotState.finalizing}
        canFinalize={snapshotState.canFinalize}
        onFinalize={snapshotState.finalize}
      />

      {snapshotState.error ? <CopilotErrorAlert message={snapshotState.error} /> : null}

      <SegmentedControl
        items={SPRINT_VIEW_ITEMS}
        value={view}
        onValueChange={setView}
        ariaLabel="Vista del sprint"
        fullWidth
        className="max-w-md"
      />

      {view === "stats" ? (
        snapshotState.loading ? (
          <SprintStatsDashboardSkeleton showScopeToggle />
        ) : showSnapshotViews ? (
          <SprintSnapshotDashboardView
            snapshot={snapshotState.snapshot!}
            project={project}
          />
        ) : (
          <SprintStatsDashboardView
            stats={statsState.stats}
            project={project}
            loading={statsState.loading}
            error={statsState.error}
            isPastSprint={snapshotState.isPastSprint}
            goalOnly={statsState.goalOnly}
            onGoalOnlyChange={statsState.setGoalOnly}
          />
        )
      ) : snapshotState.loading ? (
        <SprintSnapshotGoalViewSkeleton />
      ) : showSnapshotViews ? (
        <SprintSnapshotGoalView
          snapshot={snapshotState.snapshot!}
          project={project}
          team={team}
          sprintPath={sprint.path}
        />
      ) : goalEditor.loading ? (
        <SprintGoalViewSkeleton />
      ) : (
        <SprintGoalView
          editor={goalEditor}
          project={project}
          team={team}
          sprint={sprint}
          onSaved={statsState.reload}
        />
      )}
    </div>
  );
}
