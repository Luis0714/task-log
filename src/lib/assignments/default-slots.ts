export type DefaultSlot = Readonly<{ projectLabel: string; teamName: string }>;

/**
 * Combina proyectos × equipos para inferir las filas "por defecto". Si no hay
 * proyectos o equipos seleccionados, cae a los del catálogo. Devuelve `[]`
 * cuando no hay combinación posible (no hay nada que inferir).
 */
export function buildDefaultSlots(
  selectedProjects: readonly string[],
  selectedTeams: readonly string[],
  allProjectLabels: readonly string[],
  allTeamNames: readonly string[],
): DefaultSlot[] {
  const projects = selectedProjects.length > 0 ? selectedProjects : allProjectLabels;
  if (projects.length === 0) return [];

  const teams = selectedTeams.length > 0 ? selectedTeams : allTeamNames;
  if (teams.length === 0) return [];

  return projects.flatMap((projectLabel) =>
    teams.map((teamName) => ({ projectLabel, teamName })),
  );
}
