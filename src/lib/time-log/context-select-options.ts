import type { FormSelectOption } from "@/components/time-log/fields/form-select-field";
import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import {
  BACKLOG_SPRINT_LABEL,
  BACKLOG_SPRINT_VALUE,
} from "@/lib/time-log/backlog-scope";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

export function projectSelectOptions(projects: AdoProjectDto[]): FormSelectOption[] {
  return projects.map((item) => ({
    value: item.name,
    label: item.name,
    key: item.id,
  }));
}

export function teamSelectOptions(teams: AdoTeamDto[]): FormSelectOption[] {
  return teams.map((item) => ({
    value: item.name,
    label: item.name,
    key: item.id,
  }));
}

export type SprintSelectOptionsConfig = {
  includeBacklogOption?: boolean;
};

export function sprintSelectOptions(
  sprints: AdoSprintDto[],
  { includeBacklogOption = false }: SprintSelectOptionsConfig = {},
): FormSelectOption[] {
  const options = sprints.map((sprint) => ({
    value: sprint.path,
    label: formatSprintOptionLabel(sprint),
    key: sprint.id,
  }));

  if (!includeBacklogOption) return options;

  return [
    {
      value: BACKLOG_SPRINT_VALUE,
      label: BACKLOG_SPRINT_LABEL,
      key: BACKLOG_SPRINT_VALUE,
    },
    ...options,
  ];
}
