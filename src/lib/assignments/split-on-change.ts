import "server-only";

import { getDb } from "@/lib/db/client";
import type {
  CreateAssignmentInput,
  PersonProjectAssignmentRow,
  PersonProjectAssignmentRepository,
} from "@/lib/db";

export type SplitOnChangeInput = {
  existing: PersonProjectAssignmentRow;
  newValidFrom: Date;
  newAssignmentPct: number;
  newRoleId: string | null;
  createdByUserId: string;
};

export async function splitAssignmentOnChange(
  repo: PersonProjectAssignmentRepository,
  input: SplitOnChangeInput,
): Promise<{ closed: PersonProjectAssignmentRow; created: PersonProjectAssignmentRow }> {
  const newStart = new Date(input.newValidFrom);
  newStart.setUTCHours(0, 0, 0, 0);
  const previousEnd = new Date(newStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

  const createInput: CreateAssignmentInput = {
    personAdoId: input.existing.personAdoId,
    personDisplayName: input.existing.personDisplayName,
    projectId: input.existing.projectId,
    projectName: input.existing.projectName,
    teamId: input.existing.teamId ?? null,
    teamName: input.existing.teamName ?? null,
    roleId: input.newRoleId,
    assignmentPct: input.newAssignmentPct,
    assignedMonth: input.existing.assignedMonth ?? null,
    validFrom: newStart,
    validTo: null,
    createdByUserId: input.createdByUserId,
  };

  const db = getDb();
  return db.transaction(async (tx) => {
    void tx;
    const closed = await repo.updateEnd({
      id: input.existing.id,
      validTo: previousEnd,
    });
    const created = await repo.create(createInput);
    return { closed, created };
  });
}
