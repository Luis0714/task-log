import "server-only";

import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db";
import type { PersonProjectAssignmentRow } from "@/lib/db/ports/person-project-assignment.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import type { AssignmentSegment } from "@/lib/expected-hours";
import {
  resolveAssignmentSegments,
  toAssignmentsForSegments,
} from "@/lib/reports/hours/resolve-assignment-segments";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type LoadTeamAssignmentSegmentsInput = {
  projectId: string;
  teamId: string;
  sprintStartDate: string | null | undefined;
  sprintFinishDate: string | null | undefined;
  roster: readonly AdoTeamMemberDto[];
};

/**
 * Segmentos de asignación por miembro del roster para el periodo del sprint,
 * con las MISMAS reglas del reporte de horas por periodo: excepción en BD
 * rige; sin excepción → 100% por defecto (D17/D18). Sin BD o ante error,
 * devuelve un map vacío y el builder asume 100% para todos.
 */
export async function loadTeamAssignmentSegmentsByAssignee(
  input: LoadTeamAssignmentSegmentsInput,
): Promise<ReadonlyMap<string, readonly AssignmentSegment[]>> {
  const periodStart = input.sprintStartDate?.slice(0, 10);
  const periodEnd = input.sprintFinishDate?.slice(0, 10);
  if (!periodStart || !periodEnd || input.roster.length === 0) {
    return new Map();
  }

  const assignments = await loadTeamAssignments(input.projectId, input.teamId);
  const byPerson = groupByPersonAdoId(assignments);

  const segments = new Map<string, readonly AssignmentSegment[]>();
  for (const member of input.roster) {
    const personAssignments = byPerson.get(member.id) ?? [];
    segments.set(
      member.displayName,
      resolveAssignmentSegments({
        assignments: toAssignmentsForSegments(personAssignments),
        periodStart,
        periodEnd,
        hasInferredDefault: personAssignments.length === 0,
      }),
    );
  }
  return segments;
}

async function loadTeamAssignments(
  projectId: string,
  teamId: string,
): Promise<PersonProjectAssignmentRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await getRepositories().personProjectAssignment.listWithRoles({
      projectId,
    });
    return rows.filter((row) => row.teamId === teamId);
  } catch (cause) {
    logApiError("loadTeamAssignmentSegmentsByAssignee", cause);
    return [];
  }
}

function groupByPersonAdoId(
  rows: readonly PersonProjectAssignmentRow[],
): Map<string, PersonProjectAssignmentRow[]> {
  const grouped = new Map<string, PersonProjectAssignmentRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.personAdoId) ?? [];
    list.push(row);
    grouped.set(row.personAdoId, list);
  }
  return grouped;
}
