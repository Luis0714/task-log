import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import {
  resolvePreferredProject,
  resolvePreferredSprint,
  resolvePreferredTeam,
} from "@/lib/time-log/form-selection";

export type AdoContextSelection = {
  project: string;
  team: string;
  sprintPath: string;
};

export function pickProject(
  current: string,
  projects: AdoProjectDto[],
  defaultProject: string | null,
): string {
  if (current && projects.some((item) => item.name === current)) return current;
  return resolvePreferredProject(projects, defaultProject) ?? "";
}

export function pickTeam(
  current: string,
  teams: AdoTeamDto[],
  defaultTeam: string | null,
  suggestedTeam: string | null,
): string {
  if (current && teams.some((item) => item.name === current)) return current;
  return resolvePreferredTeam(teams, defaultTeam, suggestedTeam) ?? "";
}

export function pickSprint(current: string, sprints: AdoSprintDto[]): string {
  if (current && sprints.some((sprint) => sprint.path === current)) return current;
  return resolvePreferredSprint(sprints) ?? "";
}
