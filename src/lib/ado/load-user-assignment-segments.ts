import "server-only";

import { cache } from "react";

import { getRepositories } from "@/lib/db";
import {
  resolveAssignmentSegments,
  toAssignmentsForSegments,
  type AssignmentForSegment,
} from "@/lib/reports/hours/resolve-assignment-segments";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import type { AssignmentSegment } from "@/lib/expected-hours";

export type LoadUserAssignmentSegmentsInput = {
  projectId: string;
  sprintStartDate: string | null;
  sprintFinishDate: string | null;
};

async function loadAssignmentsFromDb(
  projectId: string,
): Promise<AssignmentForSegment[]> {
  if (!isIronSessionConfigured()) return [];
  const session = await getTaskPilotSession();
  const personAdoId = session.adoProfile?.id?.trim();
  if (!personAdoId) return [];

  const repo = getRepositories().personProjectAssignment;
  const rows = await repo.listOpenByPersonAndProject({
    personAdoId,
    projectId,
  });
  return toAssignmentsForSegments(rows);
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
      periodStart: input.sprintStartDate.slice(0, 10),
      periodEnd: input.sprintFinishDate.slice(0, 10),
      hasInferredDefault: true,
    });
  },
);