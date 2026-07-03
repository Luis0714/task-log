import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import { isBacklogScope } from "@/lib/time-log/backlog-scope";
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

export type PickSprintOptions = {
  /** Acepta el scope "Backlog completo" (pantallas de time-log y creación de tareas). */
  allowBacklogScope?: boolean;
};

export function pickSprint(
  current: string,
  sprints: AdoSprintDto[],
  { allowBacklogScope = false }: PickSprintOptions = {},
): string {
  if (allowBacklogScope && isBacklogScope(current)) return current;
  if (current && sprints.some((sprint) => sprint.path === current)) return current;
  return resolvePreferredSprint(sprints) ?? "";
}
