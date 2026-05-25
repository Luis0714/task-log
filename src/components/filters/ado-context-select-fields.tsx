"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import {
  projectSelectOptions,
  sprintSelectOptions,
  teamSelectOptions,
} from "@/lib/time-log/context-select-options";
import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
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
  sprintDayFilter,
  className,
}: AdoContextSelectFieldsProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        sprintDayFilter ? "lg:grid-cols-[1fr_1fr_minmax(0,1fr)]" : "lg:grid-cols-3",
        className,
      )}
    >
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
      <div
        className={cn(
          "flex flex-col gap-4",
          sprintDayFilter && "sm:flex-row sm:items-end sm:gap-3",
        )}
      >
        <div className={cn(sprintDayFilter && "min-w-0 flex-1")}>
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
        {sprintDayFilter}
      </div>
    </div>
  );
}
