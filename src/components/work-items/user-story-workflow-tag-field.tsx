"use client";

import { useMemo } from "react";

import { TagsCombobox } from "@/components/tags/tags-combobox";
import { useSprintWorkItemTags } from "@/hooks/sprints/use-sprint-work-item-tags";
import { mergeWorkItemTagOptions } from "@/lib/tags/tag-combobox-option";

export type UserStoryWorkflowTagFieldProps = {
  project: string | null;
  value: readonly string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export function UserStoryWorkflowTagField({
  project,
  value,
  onChange,
  disabled = false,
}: UserStoryWorkflowTagFieldProps) {
  const { tags, loading, error } = useSprintWorkItemTags(project ?? "");
  const options = useMemo(
    () => mergeWorkItemTagOptions(tags, value),
    [tags, value],
  );

  return (
    <div className="space-y-2">
      <TagsCombobox
        id="user-story-workflow-tag"
        label="Tags"
        options={options}
        value={Array.isArray(value) ? value : []}
        loading={loading}
        multiple
        disabled={disabled || Boolean(error)}
        placeholder="Selecciona tags…"
        searchPlaceholder="Buscar tag…"
        emptyMessage="No se encontraron tags en el proyecto."
        onValueChange={onChange}
      />

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}
    </div>
  );
}
