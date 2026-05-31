"use client";

import { SprintGoalWorkItemCell } from "@/components/sprints/goal/sprint-goal-work-item-cell";
import {
  SprintGoalStateObjectiveField,
  SprintGoalTacObjectiveField,
} from "@/components/sprints/goal/sprint-goal-objective-fields";
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
  return (
    <tr className={cn("border-b border-border/60 align-top", validationMessage && "bg-destructive/5")}>
      <td className="px-3 py-3 align-top">
        <SprintGoalWorkItemCell workItem={workItem} />
      </td>

      <td className="min-w-40 px-3 py-3 align-top">
        <SprintGoalStateObjectiveField
          draft={draft}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      </td>

      <td className="min-w-48 px-3 py-3 align-top">
        <SprintGoalTacObjectiveField
          draft={draft}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={disabled}
          validationMessage={validationMessage}
          onDraftChange={onDraftChange}
        />
      </td>
    </tr>
  );
}
