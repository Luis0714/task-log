"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import { AdoContextTeamDefaultHint } from "@/components/filters/ado-context-team-default-hint";
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
  defaultProject = null,
  defaultTeam = null,
  saveDefaultsPending = false,
  onSaveDefaults,
  teamsLoading = false,
  sprintsLoading = false,
  sprintDayFilter,
  markRequiredFields = false,
  includeBacklogOption = false,
  className,
}: AdoContextSelectFieldsProps) {
  const teamPlaceholder = teamsLoading ? "Cargando equipos..." : placeholders.team;
  const sprintPlaceholder = sprintsLoading ? "Cargando sprints..." : placeholders.sprint;

  return (
    <div
      className={cn(
        "grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2",
        sprintDayFilter ? "xl:grid-cols-4" : "xl:grid-cols-3",
        "*:min-w-0",
        className,
      )}
    >
      <ControlledSelectField
        label="Proyecto"
        required={markRequiredFields}
        value={project}
        placeholder={placeholders.project}
        disabled={projectSelectDisabled}
        error={projectsError}
        options={projectSelectOptions(projects)}
        onValueChange={onProjectChange}
        triggerTitle={project || undefined}
      />

      <div className="min-w-0 space-y-1">
        <ControlledSelectField
          label="Equipo"
          required={markRequiredFields}
          value={team}
          placeholder={teamPlaceholder}
          disabled={teamSelectDisabled}
          loading={teamsLoading}
          error={teamsError}
          options={teamSelectOptions(teams)}
          onValueChange={onTeamChange}
          triggerTitle={team || undefined}
          itemTextWrap
        />
      </div>

      <ControlledSelectField
        label="Sprint"
        required={markRequiredFields}
        value={sprintPath}
        placeholder={sprintPlaceholder}
        disabled={sprintSelectDisabled}
        loading={sprintsLoading}
        error={sprintsError}
        displayValue={selectedSprintLabel}
        options={sprintSelectOptions(sprints, { includeBacklogOption })}
        onValueChange={onSprintChange}
        triggerTitle={selectedSprintLabel ?? undefined}
        itemTextWrap
      />
      {sprintDayFilter ? sprintDayFilter : null}

      <AdoContextTeamDefaultHint
        project={project}
        team={team}
        defaultProject={defaultProject}
        defaultTeam={defaultTeam}
        pending={saveDefaultsPending}
        disabled={teamSelectDisabled || projectSelectDisabled}
        onSave={onSaveDefaults}
      />
    </div>
  );
}