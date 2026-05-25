"use client";

import type { UseFormReturn } from "react-hook-form";

import { AdoContextSelectFields } from "@/components/filters/ado-context-select-fields";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogContextFieldsProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
};

export function TimeLogContextFields({ form, catalog }: TimeLogContextFieldsProps) {
  return (
    <AdoContextSelectFields
      project={catalog.project}
      team={catalog.team}
      sprintPath={catalog.sprintPath}
      projects={catalog.projects}
      teams={catalog.teams}
      sprints={catalog.sprints}
      placeholders={catalog.placeholders}
      selectedSprintLabel={catalog.selectedSprintLabel}
      projectSelectDisabled={catalog.projectSelectDisabled}
      teamSelectDisabled={catalog.teamSelectDisabled}
      sprintSelectDisabled={catalog.sprintSelectDisabled}
      projectsError={catalog.projectsError}
      teamsError={catalog.teamsError}
      sprintsError={catalog.sprintsError}
      onProjectChange={(value) => {
        form.setValue("project", value, { shouldValidate: true });
        catalog.onProjectChange();
      }}
      onTeamChange={(value) => {
        form.setValue("team", value, { shouldValidate: true });
        catalog.onTeamChange();
      }}
      onSprintChange={(value) => {
        form.setValue("sprintPath", value, { shouldValidate: true });
        catalog.onSprintChange();
      }}
    />
  );
}
