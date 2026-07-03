"use client";

import type { UseFormReturn } from "react-hook-form";

import { AdoContextSelectFields } from "@/components/filters/ado-context-select-fields";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogContextFieldsProps = Readonly<{
  /**
   * Form de react-hook-form del modo Individual. Si se omite (modo
   * Múltiple), los cambios de proyecto/equipo/sprint sólo se reflejan en
   * el catálogo compartido, sin sincronizar un formulario inexistente.
   */
  form?: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
}>;

export function TimeLogContextFields({ form, catalog }: TimeLogContextFieldsProps) {
  return (
    <AdoContextSelectFields
      markRequiredFields
      includeBacklogOption
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
      teamsLoading={catalog.teamsLoading}
      sprintsLoading={catalog.sprintsLoading}
      defaultProject={catalog.defaultProject}
      defaultTeam={catalog.defaultTeam}
      saveDefaultsPending={catalog.saveDefaultsPending}
      onSaveDefaults={catalog.onSaveDefaults}
      onProjectChange={(value) => {
        form?.setValue("project", value, { shouldValidate: true });
        catalog.onProjectChange(value);
      }}
      onTeamChange={(value) => {
        form?.setValue("team", value, { shouldValidate: true });
        catalog.onTeamChange(value);
      }}
      onSprintChange={(value) => {
        form?.setValue("sprintPath", value, { shouldValidate: true });
        catalog.onSprintChange(value);
      }}
    />
  );
}
