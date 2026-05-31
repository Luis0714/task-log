"use client";

import { useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintWorkItemTagSelect } from "@/components/sprints/sprint-work-item-tag-select";
import { useSprintWorkItemTags } from "@/hooks/sprints/use-sprint-work-item-tags";

export type SprintGoalViewProps = {
  project: string;
  sprintName: string;
};

export function SprintGoalView({ project, sprintName }: SprintGoalViewProps) {
  const { tags, loading, error } = useSprintWorkItemTags(project);
  const [selectedTagId, setSelectedTagId] = useState("");

  return (
    <DashboardSection
      title="Objetivo del sprint"
      description={`Define objetivos por historia para ${sprintName}. Los TAC provienen de los tags del proyecto en Azure DevOps.`}
    >
      <div className="flex max-w-2xl flex-col gap-4">
        {error ? <CopilotErrorAlert message={error} /> : null}

        <SprintWorkItemTagSelect
          tags={tags}
          value={selectedTagId}
          loading={loading}
          onValueChange={setSelectedTagId}
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
