export type InferredDefaultSlot = {
  personAdoId: string;
  projectId: string;
  teamId: string | null;
};

export type ExistingAssignmentSlot = {
  personAdoId: string;
  projectId: string;
  teamId: string | null;
};

function projectKey(personAdoId: string, projectId: string): string {
  return `${personAdoId}::${projectId}`;
}

function teamKey(personAdoId: string, projectId: string, teamId: string): string {
  return `${personAdoId}::${projectId}::${teamId}`;
}

/**
 * Deja solo los slots (persona, proyecto, equipo) SIN excepción en BD, con la
 * misma granularidad del reporte por periodo: la excepción de un equipo NO
 * suprime los defaults de los otros equipos del proyecto (antes se suprimía
 * por persona+proyecto y la persona dejaba de aparecer una vez por equipo).
 * Una excepción a nivel de proyecto (`teamId` null) sí cubre todos sus
 * equipos, y un slot a nivel de proyecto queda cubierto por cualquier
 * excepción del proyecto.
 */
export function filterInferredDefaultSlots<T extends InferredDefaultSlot>(
  slots: readonly T[],
  existing: readonly ExistingAssignmentSlot[],
): T[] {
  const anyInProject = new Set<string>();
  const projectWide = new Set<string>();
  const byTeam = new Set<string>();

  for (const row of existing) {
    const key = projectKey(row.personAdoId, row.projectId);
    anyInProject.add(key);
    if (row.teamId === null) {
      projectWide.add(key);
    } else {
      byTeam.add(teamKey(row.personAdoId, row.projectId, row.teamId));
    }
  }

  return slots.filter((slot) => {
    const key = projectKey(slot.personAdoId, slot.projectId);
    if (slot.teamId === null) return !anyInProject.has(key);
    if (projectWide.has(key)) return false;
    return !byTeam.has(teamKey(slot.personAdoId, slot.projectId, slot.teamId));
  });
}
