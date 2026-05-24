import type { UseFormReturn } from "react-hook-form";

import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import {
  projectSelectOptions,
  sprintSelectOptions,
  teamSelectOptions,
} from "@/lib/time-log/context-select-options";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type ContextFieldProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
};

export function ProjectSelectField({ form, catalog }: ContextFieldProps) {
  return (
    <FormSelectField
      control={form.control}
      name="project"
      label="Proyecto"
      placeholder={catalog.placeholders.project}
      disabled={catalog.projectSelectDisabled}
      error={catalog.projectsError}
      options={projectSelectOptions(catalog.projects)}
      onValueChange={() => catalog.onProjectChange()}
    />
  );
}

export function TeamSelectField({ form, catalog }: ContextFieldProps) {
  return (
    <FormSelectField
      control={form.control}
      name="team"
      label="Equipo"
      placeholder={catalog.placeholders.team}
      disabled={catalog.teamSelectDisabled}
      error={catalog.teamsError}
      options={teamSelectOptions(catalog.teams)}
      onValueChange={() => catalog.onTeamChange()}
    />
  );
}

export function SprintSelectField({ form, catalog }: ContextFieldProps) {
  return (
    <FormSelectField
      control={form.control}
      name="sprintPath"
      label="Sprint"
      placeholder={catalog.placeholders.sprint}
      disabled={catalog.sprintSelectDisabled}
      error={catalog.sprintsError}
      displayValue={catalog.selectedSprintLabel}
      options={sprintSelectOptions(catalog.sprints)}
      onValueChange={() => catalog.onSprintChange()}
    />
  );
}
