import type { PersonProjectAssignmentWithRole } from "@/lib/db";

export type { PersonProjectAssignmentRow } from "@/lib/db";

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
  assignedMonth: string | null;
  validFrom: string;
  validTo: string | null;
  status: "vigente" | "historica";
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
    assignedMonth: row.assignedMonth ?? null,
    validFrom: toIso(row.validFrom),
    validTo: row.validTo ? toIso(row.validTo) : null,
    status: row.validTo ? "historica" : "vigente",
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
