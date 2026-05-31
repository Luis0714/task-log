"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SprintGoalView } from "@/components/sprints/sprint-goal-view";
import { SprintSnapshotBanner } from "@/components/sprints/snapshot/sprint-snapshot-banner";
import { SprintSnapshotDashboardView } from "@/components/sprints/snapshot/sprint-snapshot-dashboard-view";
import { SprintSnapshotGoalView } from "@/components/sprints/snapshot/sprint-snapshot-goal-view";
import { SprintStatsDashboardView } from "@/components/sprints/sprint-stats-dashboard-view";
import type { UseSprintGoalEditorResult } from "@/hooks/sprints/use-sprint-goal-editor";
import type { UseSprintSnapshotResult } from "@/hooks/sprints/use-sprint-snapshot";
import { useSprintViewUrl } from "@/hooks/sprints/use-sprint-view-url";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintViewId } from "@/lib/sprints/sprint-view";

const SPRINT_VIEW_ITEMS = [
  { value: "stats" as const, label: "Dashboard" },
  { value: "goal" as const, label: "Objetivo" },
] satisfies readonly { value: SprintViewId; label: string }[];

export type SprintsPageContentProps = {
  sprint: AdoSprintDto | null;
  goalEditor: UseSprintGoalEditorResult;
  snapshotState: UseSprintSnapshotResult;
};

export function SprintsPageContent({
  sprint,
  goalEditor,
  snapshotState,
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
          <p className="text-muted-foreground text-sm">Cargando retrospectiva del sprint…</p>
        ) : showSnapshotViews ? (
          <SprintSnapshotDashboardView snapshot={snapshotState.snapshot!} />
        ) : (
          <SprintStatsDashboardView isPastSprint={snapshotState.isPastSprint} />
        )
      ) : snapshotState.loading ? (
        <p className="text-muted-foreground text-sm">Cargando retrospectiva del sprint…</p>
      ) : showSnapshotViews ? (
        <SprintSnapshotGoalView snapshot={snapshotState.snapshot!} />
      ) : (
        <SprintGoalView editor={goalEditor} />
      )}
    </div>
  );
}
