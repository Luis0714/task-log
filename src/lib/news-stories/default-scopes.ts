import {
  pruneTeamSelection,
  teamNamesForProjects,
  type TeamsByProject,
} from "@/lib/filters/teams-by-project";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

/**
 * Resuelve la selección inicial de (proyectos, equipos) con la siguiente
 * cascada, replicando el comportamiento de la pantalla de asignaciones:
 *  1. Preferencias del usuario para el scope `newsStories` (intersectadas
 *     con el catálogo actual — entradas inválidas se descartan).
 *  2. Defaults del catálogo (`catalog.defaultProject`, `catalog.defaultTeam`)
 *     — equivale a la selección por defecto que hace "Asignaciones".
 *  3. Lista vacía si el catálogo no expone defaults (no hay preset).
 */
export function resolveSavedScopes(
  saved: WorkItemFilters | null | undefined,
  catalog: {
    projects: ReadonlyArray<string>;
    teams: ReadonlyArray<string>;
    defaultProject: string | null;
    defaultTeam: string | null;
  },
): {
  selectedProjects: ReadonlyArray<string>;
  selectedTeams: ReadonlyArray<string>;
} {
  const projectsFromSaved = saved?.projects ?? null;
  const teamsFromSaved = saved?.teams ?? null;

  if (
    projectsFromSaved !== null &&
    teamsFromSaved !== null &&
    (projectsFromSaved.length > 0 || teamsFromSaved.length > 0)
  ) {
    return {
      selectedProjects: projectsFromSaved.filter((p) =>
        catalog.projects.includes(p),
      ),
      selectedTeams: teamsFromSaved.filter((t) =>
        catalog.teams.includes(t),
      ),
    };
  }

  return {
    selectedProjects: catalog.defaultProject &&
    catalog.projects.includes(catalog.defaultProject)
      ? [catalog.defaultProject]
      : [],
    selectedTeams: catalog.defaultTeam &&
    catalog.teams.includes(catalog.defaultTeam)
      ? [catalog.defaultTeam]
      : [],
  };
}

/**
 * Variante de `resolveSavedScopes` para pantallas donde los equipos dependen
 * de los proyectos seleccionados: valida los equipos guardados contra la
 * unión del catálogo y descarta los que no pertenecen a ningún proyecto de la
 * selección resultante.
 */
export function resolveSavedScopesByProject(
  saved: WorkItemFilters | null | undefined,
  catalog: {
    projects: ReadonlyArray<string>;
    teamsByProject: TeamsByProject;
    defaultProject: string | null;
    defaultTeam: string | null;
  },
): {
  selectedProjects: ReadonlyArray<string>;
  selectedTeams: ReadonlyArray<string>;
} {
  const scopes = resolveSavedScopes(saved, {
    projects: catalog.projects,
    teams: teamNamesForProjects(catalog.teamsByProject, []),
    defaultProject: catalog.defaultProject,
    defaultTeam: catalog.defaultTeam,
  });
  return {
    selectedProjects: scopes.selectedProjects,
    selectedTeams: pruneTeamSelection(
      scopes.selectedTeams,
      teamNamesForProjects(catalog.teamsByProject, scopes.selectedProjects),
    ),
  };
}
