"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { SprintGoalView } from "@/components/sprints/sprint-goal-view";
import { SprintStatsDashboardView } from "@/components/sprints/sprint-stats-dashboard-view";
import type { UseSprintGoalEditorResult } from "@/hooks/sprints/use-sprint-goal-editor";
import { useSprintViewUrl } from "@/hooks/sprints/use-sprint-view-url";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

const SPRINT_VIEW_ITEMS = [
  { value: "stats" as const, label: "Estadísticas" },
  { value: "goal" as const, label: "Objetivo" },
] satisfies readonly { value: SprintViewId; label: string }[];

export type SprintsPageContentProps = {
  sprint: AdoSprintDto | null;
  goalEditor: UseSprintGoalEditorResult;
};

export function SprintsPageContent({
  sprint,
  goalEditor,
}: SprintsPageContentProps) {
  const { view, setView } = useSprintViewUrl();
  if (!sprint) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecciona un proyecto, equipo y sprint para ver el análisis.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        items={SPRINT_VIEW_ITEMS}
        value={view}
        onValueChange={setView}
        ariaLabel="Vista del sprint"
        fullWidth
        className="max-w-md"
      />

      {view === "stats" ? (
        <SprintStatsDashboardView />
      ) : (
        <SprintGoalView editor={goalEditor} />
      )}
    </div>
  );
}
