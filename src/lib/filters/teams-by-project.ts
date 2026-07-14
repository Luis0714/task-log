import type { AdoTeamDto } from "@/lib/schemas/ado-catalog";

export type TeamsByProject = Readonly<Record<string, readonly AdoTeamDto[]>>;

/**
 * Unión de los equipos de los proyectos seleccionados, sin duplicados por
 * nombre y ordenada alfabéticamente. Sin selección (`[]`) aplica sobre todos
 * los proyectos del mapa.
 */
export function teamsForProjects(
  teamsByProject: TeamsByProject,
  selectedProjects: readonly string[],
): AdoTeamDto[] {
  const projects =
    selectedProjects.length > 0 ? selectedProjects : Object.keys(teamsByProject);
  const byName = new Map<string, AdoTeamDto>();
  for (const project of projects) {
    for (const team of teamsByProject[project] ?? []) {
      if (!byName.has(team.name)) byName.set(team.name, team);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function teamNamesForProjects(
  teamsByProject: TeamsByProject,
  selectedProjects: readonly string[],
): string[] {
  return teamsForProjects(teamsByProject, selectedProjects).map((team) => team.name);
}

/** Descarta de la selección los equipos que ya no están disponibles. */
export function pruneTeamSelection(
  selectedTeams: readonly string[],
  availableTeamNames: readonly string[],
): string[] {
  const available = new Set(availableTeamNames);
  return selectedTeams.filter((team) => available.has(team));
}
