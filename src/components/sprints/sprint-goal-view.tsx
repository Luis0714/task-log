"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { SprintGoalGeneralObjectiveField } from "@/components/sprints/goal/sprint-goal-general-objective-field";
import { SprintGoalSaveActions } from "@/components/sprints/goal/sprint-goal-save-actions";
import { SprintGoalShareActions } from "@/components/sprints/goal/sprint-goal-share-actions";
import { SprintGoalTable } from "@/components/sprints/goal/sprint-goal-table";
import { SprintGoalToolbar } from "@/components/sprints/goal/sprint-goal-toolbar";
import type { UseSprintGoalEditorResult } from "@/hooks/sprints/use-sprint-goal-editor";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import { appToast } from "@/lib/toast";

export type SprintGoalViewProps = {
  editor: UseSprintGoalEditorResult;
  project: string;
  team: string;
  sprint: AdoSprintDto;
  onSaved?: () => void;
};

export function SprintGoalView({
  editor,
  project,
  team,
  sprint,
  onSaved,
}: SprintGoalViewProps) {
  const canShare =
    editor.persistenceReady &&
    !editor.loading &&
    !editor.saving &&
    !editor.isDirty &&
    editor.goalsCount > 0;

  async function handleSave() {
    const result = await editor.save();
    if (result.ok) {
      appToast.success("Objetivos del sprint guardados.");
      onSaved?.();
      return;
    }
    appToast.error(result.message);
  }

  return (
    <div className="flex flex-col gap-4">
      {editor.error ? <CopilotErrorAlert message={editor.error} /> : null}

      <SprintGoalToolbar
        storyCount={editor.displayRows.length}
        totalStoryCount={editor.rows.length}
        excludedStoryCount={editor.excludedStoryCount}
        goalsCount={editor.goalsCount}
        storySearch={editor.storySearch}
        actions={
          <SprintGoalShareActions
            project={project}
            team={team}
            sprintPath={sprint.path}
            sprintName={sprint.name}
            sprintStartDate={sprint.startDate}
            sprintFinishDate={sprint.finishDate}
            canShare={canShare}
          />
        }
      />

      <SprintGoalGeneralObjectiveField
        value={editor.generalObjective}
        disabled={editor.loading || editor.saving}
        onChange={editor.setGeneralObjective}
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

      <SprintGoalSaveActions
        isDirty={editor.isDirty}
        canSave={editor.canSave}
        saving={editor.saving}
        onSave={handleSave}
        onDiscard={editor.discardChanges}
      />
    </div>
  );
}
