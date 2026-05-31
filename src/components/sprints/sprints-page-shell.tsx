"use client";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { SprintGoalFiltersPanel } from "@/components/sprints/goal/sprint-goal-filters-panel";
import { SprintFinalizeDialog } from "@/components/sprints/snapshot/sprint-finalize-dialog";
import { SelectedSprintMeta } from "@/components/sprints/selected-sprint-summary";
import { SprintsPageContent } from "@/components/sprints/sprints-page-content";
import { useSprintGoalEditor } from "@/hooks/sprints/use-sprint-goal-editor";
import { useSprintSnapshot } from "@/hooks/sprints/use-sprint-snapshot";
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

  const showGoalFilters =
    view === "goal" && currentSprint !== null && !snapshotState.isFinalized;

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
    currentSprint && snapshotState.persistenceReady ? (
      <SprintFinalizeDialog
        finalizing={snapshotState.finalizing}
        disabled={!snapshotState.canFinalize}
        buttonLabel={
          snapshotState.isFinalized ? "Actualizar retrospectiva" : "Finalizar sprint"
        }
        dialogTitle={
          snapshotState.isFinalized ? "Actualizar retrospectiva" : "Finalizar sprint"
        }
        dialogDescription={
          snapshotState.isFinalized
            ? "Se creará una nueva versión de la retrospectiva con el estado actual de las historias y objetivos."
            : "Se guardará una fotografía del objetivo y del estado final de cada historia. Podrás consultarla más adelante aunque las HUs cambien de sprint o de estado en Azure DevOps."
        }
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
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
    >
      <SprintsPageContent
        sprint={currentSprint}
        goalEditor={goalEditor}
        snapshotState={snapshotState}
      />
    </AdoContextPageShell>
  );
}
