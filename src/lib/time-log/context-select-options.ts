import type { FormSelectOption } from "@/components/time-log/fields/form-select-field";
import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
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

export function sprintSelectOptions(sprints: AdoSprintDto[]): FormSelectOption[] {
  return sprints.map((sprint) => ({
    value: sprint.path,
    label: formatSprintOptionLabel(sprint),
    key: sprint.id,
  }));
}
