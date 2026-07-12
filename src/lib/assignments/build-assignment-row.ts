import type { PersonProjectAssignmentWithRole } from "@/lib/db";

export type { PersonProjectAssignmentRow } from "@/lib/db";

/**
 * Forma "alambrada al cliente" de una asignación. Se calcula a partir del
 * row de BD; no contiene campos derivados como el estado (vigente/histórica),
 * que se computa en el momento de pintar/filtrar.
 */
export type AssignmentDto = {
  id: string;
  personAdoId: string;
  personDisplayName: string;
  projectId: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
  roleId: string | null;
  roleName: string | null;
  roleDisplayName: string | null;
  assignmentPct: number;
  validFrom: string;
  validTo: string | null;
  createdByUserId: string;
  createdByDisplayName: string | null;
  createdAt: string;
};

export function assignmentRowToDto(
  row: PersonProjectAssignmentWithRole,
): AssignmentDto {
  return {
    id: row.id,
    personAdoId: row.personAdoId,
    personDisplayName: row.personDisplayName,
    projectId: row.projectId,
    projectName: row.projectName,
    teamId: row.teamId ?? null,
    teamName: row.teamName ?? null,
    roleId: row.roleId ?? null,
    roleName: row.roleName ?? null,
    roleDisplayName: row.roleDisplayName ?? null,
    assignmentPct: row.assignmentPct,
    validFrom: toIso(row.validFrom),
    validTo: row.validTo ? toIso(row.validTo) : null,
    createdByUserId: row.createdByUserId,
    createdByDisplayName: row.createdByDisplayName ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toIso(d: Date | string | null | undefined): string {
  if (d == null) return "";
  if (typeof d === "string") return d;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
