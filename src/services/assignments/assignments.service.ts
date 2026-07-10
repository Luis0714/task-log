import "client-only";

import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import type { WorkingDayDecisionDto } from "@/services/assignments/working-day-decisions.service";

export type AssignmentRoleOption = {
  id: string;
  name: string;
  displayName: string;
};

export type AssignmentFilter = {
  personAdoId?: string;
  projectId?: string;
  status?: "vigente" | "historica" | "todas";
};

export type CreateAssignmentPayload = {
  personAdoId: string;
  personDisplayName: string;
  projectId: string;
  projectName: string;
  teamId?: string | null;
  teamName?: string | null;
  roleId?: string | null;
  assignmentPct: number;
  assignedMonth?: string | null;
  validFrom: string;
  validTo: string | null;
  /**
   * Cuando está definido y tiene más de un ID, la API crea una asignación
   * por cada persona (modo "Todos"). El primer elemento debe ser el ID
   * de la persona fija para mantener compatibilidad hacia atrás.
   */
  personAdoIds?: string[];
  workingDayDecisions?: WorkingDayDecisionDto[];
};

export type ChangeAssignmentPayload = {
  newAssignmentPct: number;
  newRoleId?: string | null;
  validFrom: string;
};

export type CloseAssignmentPayload = {
  validTo: string;
};

export type AdoTeamMember = {
  id: string;
  displayName: string;
  uniqueName: string;
};

export type AssignmentDefaultContext = {
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
};

export type AssignmentErrorPayload = {
  error: string;
  code?: string;
  currentTotal?: number | null;
  conflictingPct?: number | null;
};

async function parseError(res: Response): Promise<AssignmentErrorPayload> {
  try {
    const body = (await res.json()) as Partial<AssignmentErrorPayload>;
    return {
      error: body.error ?? `Error ${res.status}.`,
      code: body.code,
      currentTotal: body.currentTotal,
      conflictingPct: body.conflictingPct,
    };
  } catch {
    return { error: `Error ${res.status}.` };
  }
}

function toQuery(filter: AssignmentFilter): string {
  const params = new URLSearchParams();
  if (filter.personAdoId) params.set("personAdoId", filter.personAdoId);
  if (filter.projectId) params.set("projectId", filter.projectId);
  if (filter.status) params.set("status", filter.status);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function listAssignments(
  filter: AssignmentFilter,
): Promise<AssignmentDto[]> {
  const res = await fetch(`/api/assignments${toQuery(filter)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await parseError(res);
    throw Object.assign(new Error(err.error), {
      code: err.code,
      currentTotal: err.currentTotal,
      conflictingPct: err.conflictingPct,
    });
  }
  const body = (await res.json()) as { assignments: AssignmentDto[] };
  return body.assignments;
}

export type CreateAssignmentResult = {
  createdCount: number;
  assignments: AssignmentDto[];
};

export async function createAssignment(
  input: CreateAssignmentPayload,
): Promise<CreateAssignmentResult> {
  const res = await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await parseError(res);
    throw Object.assign(new Error(err.error), {
      code: err.code,
      currentTotal: err.currentTotal,
      conflictingPct: err.conflictingPct,
    });
  }
  const body = (await res.json()) as
    | { assignment: AssignmentDto; createdCount?: number }
    | { assignments: AssignmentDto[]; createdCount: number };
  if ("assignments" in body) {
    return { createdCount: body.createdCount, assignments: body.assignments };
  }
  if (body.assignment) {
    return {
      createdCount: body.createdCount ?? 1,
      assignments: [body.assignment],
    };
  }
  return { createdCount: 0, assignments: [] };
}

export async function changeAssignment(
  id: string,
  input: ChangeAssignmentPayload,
): Promise<AssignmentDto> {
  const res = await fetch(`/api/assignments/${id}/change`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await parseError(res);
    throw Object.assign(new Error(err.error), {
      code: err.code,
      currentTotal: err.currentTotal,
      conflictingPct: err.conflictingPct,
    });
  }
  const body = (await res.json()) as { assignment: AssignmentDto };
  return body.assignment;
}

export async function closeAssignment(
  id: string,
  input: CloseAssignmentPayload,
): Promise<AssignmentDto> {
  const res = await fetch(`/api/assignments/${id}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await parseError(res);
    throw Object.assign(new Error(err.error), { code: err.code });
  }
  const body = (await res.json()) as { assignment: AssignmentDto };
  return body.assignment;
}

export async function listAssignmentRoles(): Promise<AssignmentRoleOption[]> {
  const res = await fetch("/api/assignments/options", { cache: "no-store" });
  if (!res.ok) {
    throw new Error((await parseError(res)).error);
  }
  const body = (await res.json()) as { roles: AssignmentRoleOption[] };
  return body.roles;
}

export async function listTeamMembersByProjectAndTeam(
  projectName: string,
  teamName: string,
): Promise<AdoTeamMember[]> {
  const params = new URLSearchParams({
    project: projectName,
    team: teamName,
  });
  const res = await fetch(`/api/ado/team-members?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error((await parseError(res)).error);
  }
  const body = (await res.json()) as { members: AdoTeamMember[] };
  return body.members;
}

