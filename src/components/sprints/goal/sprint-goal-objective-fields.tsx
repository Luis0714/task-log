"use client";

import { useMemo } from "react";

import { TagsCombobox } from "@/components/tags/tags-combobox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { mergeWorkItemTagOptions } from "@/lib/tags/tag-combobox-option";
import type { SprintStoryGoalDraft } from "@/lib/sprints/sprint-story-goal";
import { isSelectClearValue, SELECT_CLEAR_VALUE } from "@/lib/ui/select-clear-value";
import { XIcon } from "lucide-react";

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
    () => mergeWorkItemTagOptions(catalogTags, draft.targetTagNames),
    [catalogTags, draft.targetTagNames],
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
      onValueChange={(value) => {
        if (isSelectClearValue(value)) {
          onDraftChange({ targetStateName: "" });
          return;
        }
        onDraftChange({ targetStateName: value ?? "" });
      }}
    >
      <SelectTrigger id={id} className="w-full min-w-36">
        <SelectValue placeholder="Estado objetivo">
          {draft.targetStateName ? (
            <WorkItemStateLabel state={draft.targetStateName} />
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SELECT_CLEAR_VALUE} className="text-muted-foreground">
          Sin objetivo
        </SelectItem>
        <SelectSeparator />
        {stateOptions.map((state) => (
          <SelectItem key={state} value={state}>
            <WorkItemStateLabel state={state} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SprintGoalTagsObjectiveField({
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
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <TagsCombobox
            id={id}
            options={tagOptions}
            value={draft.targetTagNames}
            multiple
            disabled={disabled}
            placeholder="Tags objetivo"
            searchPlaceholder="Buscar tag…"
            emptyMessage="Sin tags en el proyecto."
            onValueChange={(values) => onDraftChange({ targetTagNames: values })}
          />
        </div>
        {draft.targetTagNames.length > 0 && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="mt-1 shrink-0"
            title="Quitar tags objetivo"
            aria-label="Quitar tags objetivo"
            onClick={() => onDraftChange({ targetTagNames: [] })}
          >
            <XIcon className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
      {validationMessage ? (
        <p className="text-destructive text-xs">{validationMessage}</p>
      ) : null}
    </div>
  );
}

/** @deprecated Usa SprintGoalTagsObjectiveField */
export const SprintGoalTacObjectiveField = SprintGoalTagsObjectiveField;
