"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintGoalTable } from "@/components/sprints/goal/sprint-goal-table";
import { SprintGoalToolbar } from "@/components/sprints/goal/sprint-goal-toolbar";
import { useSprintGoalEditor } from "@/hooks/sprints/use-sprint-goal-editor";
import { appToast } from "@/lib/toast";

export type SprintGoalViewProps = {
  project: string;
  team: string;
  sprintPath: string;
  sprintName: string;
};

export function SprintGoalView({
  project,
  team,
  sprintPath,
  sprintName,
}: SprintGoalViewProps) {
  const editor = useSprintGoalEditor({ project, team, sprintPath });

  async function handleSave() {
    const result = await editor.save();
    if (result.ok) {
      appToast.success("Objetivos del sprint guardados.");
      return;
    }
    appToast.error(result.message);
  }

  return (
    <DashboardSection
      title="Objetivo del sprint"
      description={`Define objetivos por historia para ${sprintName}. Compara estado y tags actuales con el objetivo del sprint.`}
    >
      <div className="flex flex-col gap-4">
        {editor.error ? <CopilotErrorAlert message={editor.error} /> : null}

        <SprintGoalToolbar
          storyCount={editor.displayRows.length}
          totalStoryCount={editor.rows.length}
          goalsCount={editor.goalsCount}
          storySearch={editor.storySearch}
          sortSpec={editor.sortSpec}
          isDirty={editor.isDirty}
          canSave={editor.canSave}
          saving={editor.saving}
          disabled={editor.loading}
          onStorySearchChange={editor.setStorySearch}
          onSortSpecChange={editor.setSortSpec}
          onSave={handleSave}
          onDiscard={editor.discardChanges}
        />

        {editor.displayRows.length === 0 && editor.rows.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            Ninguna historia coincide con la búsqueda.
          </p>
        ) : (
          <SprintGoalTable
            rows={editor.displayRows}
            drafts={editor.drafts}
            backlogStates={editor.backlogStates}
            catalogTags={editor.catalogTags}
            loading={editor.loading}
            disabled={editor.saving}
            onDraftChange={editor.updateDraft}
            getRowValidationMessage={editor.getRowValidationMessage}
          />
        )}
      </div>
    </DashboardSection>
  );
}
