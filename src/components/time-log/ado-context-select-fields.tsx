"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import {
  projectSelectOptions,
  sprintSelectOptions,
  teamSelectOptions,
} from "@/lib/time-log/context-select-options";
import type { AdoContextSelectFieldsProps } from "@/lib/time-log/context-selection-types";
import { cn } from "@/lib/utils";

export function AdoContextSelectFields({
  project,
  team,
  sprintPath,
  projects,
  teams,
  sprints,
  placeholders,
  selectedSprintLabel,
  projectSelectDisabled,
  teamSelectDisabled,
  sprintSelectDisabled,
  projectsError,
  teamsError,
  sprintsError,
  onProjectChange,
  onTeamChange,
  onSprintChange,
  className,
}: AdoContextSelectFieldsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <ControlledSelectField
        label="Proyecto"
        value={project}
        placeholder={placeholders.project}
        disabled={projectSelectDisabled}
        error={projectsError}
        options={projectSelectOptions(projects)}
        onValueChange={onProjectChange}
      />
      <ControlledSelectField
        label="Equipo"
        value={team}
        placeholder={placeholders.team}
        disabled={teamSelectDisabled}
        error={teamsError}
        options={teamSelectOptions(teams)}
        onValueChange={onTeamChange}
      />
      <ControlledSelectField
        label="Sprint"
        value={sprintPath}
        placeholder={placeholders.sprint}
        disabled={sprintSelectDisabled}
        error={sprintsError}
        displayValue={selectedSprintLabel}
        options={sprintSelectOptions(sprints)}
        onValueChange={onSprintChange}
      />
    </div>
  );
}
