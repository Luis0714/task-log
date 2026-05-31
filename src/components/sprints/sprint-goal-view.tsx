"use client";

import { useMemo, useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { TagsCombobox } from "@/components/tags/tags-combobox";
import { useProjectWorkItemTags } from "@/hooks/tags/use-project-work-item-tags";
import { mapAdoWorkItemTagsToOptions } from "@/lib/tags/tag-combobox-option";

export type SprintGoalViewProps = {
  project: string;
  sprintName: string;
};

export function SprintGoalView({ project, sprintName }: SprintGoalViewProps) {
  const { tags, loading, error } = useProjectWorkItemTags(project);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const tagOptions = useMemo(() => mapAdoWorkItemTagsToOptions(tags), [tags]);

  return (
    <DashboardSection
      title="Objetivo del sprint"
      description={`Define objetivos por historia para ${sprintName}. Los TAC provienen de los tags del proyecto en Azure DevOps.`}
    >
      <div className="flex max-w-2xl flex-col gap-4">
        {error ? <CopilotErrorAlert message={error} /> : null}

        <TagsCombobox
          label="TAC objetivo"
          options={tagOptions}
          value={selectedTagIds}
          loading={loading}
          multiple={false}
          placeholder="Selecciona un tag"
          searchPlaceholder="Buscar tag…"
          emptyMessage="No se encontraron tags en el proyecto."
          onValueChange={setSelectedTagIds}
        />

        {!loading && !error && tags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este proyecto no tiene tags definidos en Azure DevOps.
          </p>
        ) : null}

        {!loading && tags.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            {tags.length} tag{tags.length === 1 ? "" : "s"} disponible
            {tags.length === 1 ? "" : "s"} en el proyecto.
          </p>
        ) : null}
      </div>
    </DashboardSection>
  );
}
