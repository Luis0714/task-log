"use client";

import { SprintGoalWorkItemCell } from "@/components/sprints/goal/sprint-goal-work-item-cell";
import {
  SprintGoalStateObjectiveField,
  SprintGoalTacObjectiveField,
} from "@/components/sprints/goal/sprint-goal-objective-fields";
import { Checkbox } from "@/components/ui/checkbox";
import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraft } from "@/lib/sprints/sprint-story-goal";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintGoalRowProps = {
  workItem: AdoWorkItemOptionDto;
  draft: SprintStoryGoalDraft;
  backlogStates: readonly AdoTaskStateDto[];
  catalogTags: readonly AdoWorkItemTagDto[];
  disabled?: boolean;
  validationMessage?: string | null;
  onDraftChange: (patch: Partial<Omit<SprintStoryGoalDraft, "workItemId">>) => void;
};

export function SprintGoalRow({
  workItem,
  draft,
  backlogStates,
  catalogTags,
  disabled = false,
  validationMessage,
  onDraftChange,
}: SprintGoalRowProps) {
  const fieldsDisabled = disabled || !draft.includedInGoal;

  return (
    <tr
      className={cn(
        "border-b border-border/60 align-top",
        validationMessage && "bg-destructive/5",
        !draft.includedInGoal && "bg-muted/20",
      )}
    >
      <td className="px-3 py-3 align-top">
        <SprintGoalWorkItemCell workItem={workItem} muted={!draft.includedInGoal} />
      </td>

      <td className="min-w-40 px-3 py-3 align-top">
        <SprintGoalStateObjectiveField
          draft={draft}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={fieldsDisabled}
          onDraftChange={onDraftChange}
        />
      </td>

      <td className="min-w-48 px-3 py-3 align-top">
        <SprintGoalTacObjectiveField
          draft={draft}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={fieldsDisabled}
          validationMessage={validationMessage}
          onDraftChange={onDraftChange}
        />
      </td>

      <td className="w-16 px-2 py-3 text-center align-top">
        <div className="flex justify-center pt-1">
          <Checkbox
            checked={draft.includedInGoal}
            disabled={disabled}
            aria-label={`Incluir historia #${workItem.id} en el objetivo del sprint`}
            title="Incluida en el objetivo"
            onCheckedChange={(checked) =>
              onDraftChange({ includedInGoal: checked === true })
            }
          />
        </div>
      </td>
    </tr>
  );
}
