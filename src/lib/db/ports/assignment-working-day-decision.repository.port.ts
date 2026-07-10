import type { AssignmentWorkingDayDecision } from "@/lib/db/schema";

export type WorkingDayDecisionInput = {
  date: string;
  decision: "habil_con_observacion" | "no_habil";
  observation: string | null;
};

export type BulkSetDecisionsInput = {
  assignmentId: string;
  decisions: WorkingDayDecisionInput[];
  createdByUserId: string;
};

export interface AssignmentWorkingDayDecisionRepository {
  listByAssignment(
    assignmentId: string,
  ): Promise<AssignmentWorkingDayDecision[]>;

  bulkUpsert(input: BulkSetDecisionsInput): Promise<void>;

  deleteByAssignment(assignmentId: string): Promise<void>;
}
