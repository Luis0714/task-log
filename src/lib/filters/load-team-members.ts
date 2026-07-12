import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { listTeamMembers } from "@/lib/azure-devops/work-item-type-states";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type LoadTeamMembersInput = {
  project: string;
  team: string;
};

/**
 * ÚNICA fuente de miembros del equipo para toda la app.
 *
 * Devuelve el roster oficial del equipo desde Azure DevOps (incluye
 * `imageUrl` cuando ADO lo provee; si no, el componente de avatar usa
 * iniciales como fallback).
 *
 * El cliente garantiza que toda persona activa de la organización está
 * dada de alta en el equipo, por lo que ya no es necesario mergear con
 * asignados del sprint para descubrir personas faltantes.
 *
 * Si falta `project`/`team` o no hay auth, devuelve `[]` para no romper
 * el render. Los errores se loguean en consola y se devuelven como array
 * vacío — los callers deben mostrar "sin opciones" en la UI.
 *
 * Cacheado con `react.cache` para deduplicar la llamada por request.
 */
export const loadTeamMembers = cache(async function loadTeamMembers(
  input: LoadTeamMembersInput,
): Promise<AdoTeamMemberDto[]> {
  const project = input.project?.trim() ?? "";
  const team = input.team?.trim() ?? "";
  if (!project || !team) return [];

  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];

  try {
    return await listTeamMembers(auth, team);
  } catch (cause) {
    console.error("loadTeamMembers failed", cause);
    return [];
  }
});