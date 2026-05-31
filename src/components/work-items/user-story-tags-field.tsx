"use client";

import { useMemo } from "react";

import { TagsCombobox } from "@/components/tags/tags-combobox";
import { useProjectWorkItemTags } from "@/hooks/tags/use-project-work-item-tags";
import { mergeWorkItemTagOptions } from "@/lib/tags/tag-combobox-option";

export type UserStoryTagsFieldProps = {
  project: string | null;
  value: readonly string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export function UserStoryTagsField({
  project,
  value,
  onChange,
  disabled = false,
}: UserStoryTagsFieldProps) {
  const { tags, loading, error } = useProjectWorkItemTags(project ?? "");
  const options = useMemo(
    () => mergeWorkItemTagOptions(tags, value),
    [tags, value],
  );

  return (
    <div className="space-y-2">
      <TagsCombobox
        id="user-story-tags"
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
