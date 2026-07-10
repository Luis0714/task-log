import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  assignmentWorkingDayDecisions,
  type AssignmentWorkingDayDecision,
} from "@/lib/db/schema";
import type {
  AssignmentWorkingDayDecisionRepository,
  BulkSetDecisionsInput,
} from "@/lib/db/ports/assignment-working-day-decision.repository.port";

function dateOnly(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return new Date(iso);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export const drizzleAssignmentWorkingDayDecisionRepository: AssignmentWorkingDayDecisionRepository =
  {
    async listByAssignment(assignmentId): Promise<AssignmentWorkingDayDecision[]> {
      return getDb()
        .select()
        .from(assignmentWorkingDayDecisions)
        .where(eq(assignmentWorkingDayDecisions.assignmentId, assignmentId));
    },

    async bulkUpsert(input: BulkSetDecisionsInput): Promise<void> {
      if (input.decisions.length === 0) return;
      const db = getDb();
      await db.transaction(async (tx) => {
        await tx
          .delete(assignmentWorkingDayDecisions)
          .where(
            and(
              eq(
                assignmentWorkingDayDecisions.assignmentId,
                input.assignmentId,
              ),
              inArray(
                assignmentWorkingDayDecisions.date,
                input.decisions.map((d) => dateOnly(d.date)),
              ),
            ),
          );

        await tx.insert(assignmentWorkingDayDecisions).values(
          input.decisions.map((d) => ({
            assignmentId: input.assignmentId,
            date: dateOnly(d.date),
            decision: d.decision,
            observation: d.observation,
            createdByUserId: input.createdByUserId,
          })),
        );
      });
    },

    async deleteByAssignment(assignmentId): Promise<void> {
      await getDb()
        .delete(assignmentWorkingDayDecisions)
        .where(eq(assignmentWorkingDayDecisions.assignmentId, assignmentId));
    },
  };
