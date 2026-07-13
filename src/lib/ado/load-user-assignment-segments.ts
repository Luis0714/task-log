import "server-only";

import { cache } from "react";

import { getRepositories } from "@/lib/db";
import { resolveAssignmentSegments } from "@/lib/reports/hours/resolve-assignment-segments";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import type { AssignmentSegment } from "@/lib/expected-hours";

export type LoadUserAssignmentSegmentsInput = {
  projectId: string;
  sprintStartDate: string | null;
  sprintFinishDate: string | null;
};

function toIsoKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadAssignmentsFromDb(
  projectId: string,
): Promise<{ assignmentPct: number; validFrom: string; validTo: string | null }[]> {
  if (!isIronSessionConfigured()) return [];
  const session = await getTaskPilotSession();
  const personAdoId = session.adoProfile?.id?.trim();
  if (!personAdoId) return [];

  const repo = getRepositories().personProjectAssignment;
  const rows = await repo.listOpenByPersonAndProject({
    personAdoId,
    projectId,
  });
  return rows.map((row) => ({
    assignmentPct: row.assignmentPct,
    validFrom: toIsoKey(row.validFrom),
    validTo: row.validTo ? toIsoKey(row.validTo) : null,
  }));
}

export const loadUserAssignmentSegments = cache(
  async function loadUserAssignmentSegments(
    input: LoadUserAssignmentSegmentsInput,
  ): Promise<readonly AssignmentSegment[]> {
    if (!input.sprintStartDate || !input.sprintFinishDate) return [];

    let assignments: { assignmentPct: number; validFrom: string; validTo: string | null }[] = [];
    try {
      assignments = await loadAssignmentsFromDb(input.projectId);
    } catch {
      assignments = [];
    }

    return resolveAssignmentSegments({
      assignments,
      periodStart: input.sprintStartDate,
      periodEnd: input.sprintFinishDate,
      hasInferredDefault: true,
    });
  },
);