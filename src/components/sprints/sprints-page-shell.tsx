"use client";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { SprintGoalFiltersPanel } from "@/components/sprints/goal/sprint-goal-filters-panel";
import { SprintFinalizeDialog } from "@/components/sprints/snapshot/sprint-finalize-dialog";
import { SelectedSprintMeta } from "@/components/sprints/selected-sprint-summary";
import { SprintsPageContent } from "@/components/sprints/sprints-page-content";
import { useSprintGoalEditor } from "@/hooks/sprints/use-sprint-goal-editor";
import { useSprintSnapshot } from "@/hooks/sprints/use-sprint-snapshot";
import { useSprintStats } from "@/hooks/sprints/use-sprint-stats";
import { useSprintViewUrl } from "@/hooks/sprints/use-sprint-view-url";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";
import { PAGE_SEO } from "@/lib/seo/pages";

export type SprintsPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
};

export function SprintsPageShell({
  catalog,
  adoExecutionReady,
}: SprintsPageShellProps) {
  const { view } = useSprintViewUrl();
  const currentSprint = resolveCurrentSprint(catalog);

  const snapshotState = useSprintSnapshot({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    sprint: currentSprint,
    enabled: Boolean(currentSprint),
  });

  const statsState = useSprintStats({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    sprintStartDate: currentSprint?.startDate,
    sprintFinishDate: currentSprint?.finishDate,
    enabled:
      Boolean(currentSprint) &&
      !snapshotState.loading &&
      !snapshotState.isFinalized,
  });

  const showGoalFilters =
    view === "goal" &&
    currentSprint !== null &&
    !snapshotState.loading &&
    !snapshotState.isFinalized;

  const goalEditor = useSprintGoalEditor({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    enabled: showGoalFilters,
  });

  const filtersSummaryExtra =
    showGoalFilters && goalEditor.storySearch.trim().length > 0
      ? "búsqueda de historias"
      : undefined;

  const headerAction =
    currentSprint &&
    snapshotState.persistenceReady &&
    !snapshotState.isFinalized ? (
      <SprintFinalizeDialog
        finalizing={snapshotState.finalizing}
        disabled={!snapshotState.canFinalize}
        onConfirm={snapshotState.finalize}
      />
    ) : null;

  return (
    <AdoContextPageShell
      title={PAGE_SEO.sprints.title}
      description={PAGE_SEO.sprints.description}
      headerMeta={
        currentSprint ? <SelectedSprintMeta sprint={currentSprint} /> : null
      }
      headerAction={headerAction}
      filtersExtra={
        showGoalFilters ? (
          <SprintGoalFiltersPanel
            storySearch={goalEditor.storySearch}
            sortSpec={goalEditor.sortSpec}
            disabled={goalEditor.loading || goalEditor.saving}
            onStorySearchChange={goalEditor.setStorySearch}
            onSortSpecChange={goalEditor.setSortSpec}
          />
        ) : null
      }
      filtersSummaryExtra={filtersSummaryExtra}
      filtersDefaultOpen
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
    >
      <SprintsPageContent
        sprint={currentSprint}
        project={catalog.project}
        goalEditor={goalEditor}
        snapshotState={snapshotState}
        statsState={statsState}
      />
    </AdoContextPageShell>
  );
}
