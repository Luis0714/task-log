"use client";

import { useMemo } from "react";

import { TagsCombobox } from "@/components/tags/tags-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { mergeWorkItemTagOptions } from "@/lib/tags/tag-combobox-option";
import type { SprintStoryGoalDraft } from "@/lib/sprints/sprint-story-goal";

export type SprintGoalObjectiveFieldsProps = {
  draft: SprintStoryGoalDraft;
  backlogStates: readonly AdoTaskStateDto[];
  catalogTags: readonly AdoWorkItemTagDto[];
  disabled?: boolean;
  validationMessage?: string | null;
  onDraftChange: (patch: Partial<Omit<SprintStoryGoalDraft, "workItemId">>) => void;
};

function useSprintGoalObjectiveOptions(
  draft: SprintStoryGoalDraft,
  backlogStates: readonly AdoTaskStateDto[],
  catalogTags: readonly AdoWorkItemTagDto[],
) {
  const stateOptions = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const tagOptions = useMemo(
    () =>
      mergeWorkItemTagOptions(
        catalogTags,
        draft.targetTacTagName ? [draft.targetTacTagName] : [],
      ),
    [catalogTags, draft.targetTacTagName],
  );

  return { stateOptions, tagOptions };
}

export function SprintGoalStateObjectiveField({
  draft,
  backlogStates,
  catalogTags,
  disabled = false,
  onDraftChange,
  id,
}: Pick<
  SprintGoalObjectiveFieldsProps,
  "draft" | "backlogStates" | "catalogTags" | "disabled" | "onDraftChange"
> & { id?: string }) {
  const { stateOptions } = useSprintGoalObjectiveOptions(draft, backlogStates, catalogTags);

  return (
    <Select
      value={draft.targetStateName || null}
      disabled={disabled || stateOptions.length === 0}
      onValueChange={(value) => onDraftChange({ targetStateName: value ?? "" })}
    >
      <SelectTrigger id={id} className="w-full min-w-36">
        <SelectValue placeholder="Estado objetivo">
          {draft.targetStateName ? (
            <WorkItemStateLabel state={draft.targetStateName} />
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {stateOptions.map((state) => (
          <SelectItem key={state} value={state}>
            <WorkItemStateLabel state={state} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SprintGoalTacObjectiveField({
  draft,
  backlogStates,
  catalogTags,
  disabled = false,
  validationMessage,
  onDraftChange,
  id,
}: Pick<
  SprintGoalObjectiveFieldsProps,
  "draft" | "backlogStates" | "catalogTags" | "disabled" | "validationMessage" | "onDraftChange"
> & { id?: string }) {
  const { tagOptions } = useSprintGoalObjectiveOptions(draft, backlogStates, catalogTags);

  return (
    <div className="min-w-44 space-y-1">
      <TagsCombobox
        id={id}
        options={tagOptions}
        value={draft.targetTacTagName ? [draft.targetTacTagName] : []}
        multiple={false}
        disabled={disabled}
        placeholder="TAC objetivo"
        searchPlaceholder="Buscar TAC…"
        emptyMessage="Sin tags en el proyecto."
        onValueChange={(values) => onDraftChange({ targetTacTagName: values[0] ?? "" })}
      />
      {validationMessage ? (
        <p className="text-destructive text-xs">{validationMessage}</p>
      ) : null}
    </div>
  );
}
