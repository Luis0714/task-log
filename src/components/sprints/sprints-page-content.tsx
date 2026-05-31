"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectedSprintSummary } from "@/components/sprints/selected-sprint-summary";
import { SprintGoalView } from "@/components/sprints/sprint-goal-view";
import { SprintStatsDashboardView } from "@/components/sprints/sprint-stats-dashboard-view";
import { useSprintViewUrl } from "@/hooks/sprints/use-sprint-view-url";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintViewId } from "@/lib/sprints/sprint-view";

const SPRINT_VIEW_ITEMS = [
  { value: "stats" as const, label: "Estadísticas" },
  { value: "goal" as const, label: "Objetivo del sprint" },
] satisfies readonly { value: SprintViewId; label: string }[];

export type SprintsPageContentProps = {
  project: string;
  sprint: AdoSprintDto | null;
};

export function SprintsPageContent({ project, sprint }: SprintsPageContentProps) {
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
      <SelectedSprintSummary sprint={sprint} />

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
        <SprintGoalView project={project} sprintName={sprint.name} />
      )}
    </div>
  );
}
