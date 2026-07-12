import type { PersonProjectAssignmentRow } from "@/lib/db";
import type {
  AssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { startOfDay } from "@/lib/assignments/is-assignment-open";

export type NewAssignmentCandidate = {
  projectId: string;
  teamId: string | null;
  validFrom: Date;
  validTo: Date | null;
  assignmentPct: number;
};

export type ValidateContext = {
  candidate: NewAssignmentCandidate;
  overlapping: PersonProjectAssignmentRow[];
};

export type ValidationOk = { ok: true };
export type ValidationFail = {
  ok: false;
  code: AssignmentErrorKey;
  /** Suma de % de otras vigencias que se cruzan con el candidato. */
  currentTotal: number;
  conflictingPct: number;
};
export type ValidationResult = ValidationOk | ValidationFail;

const intervalsOverlap = (
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null,
): boolean => {
  const aEndTime = (aEnd ?? new Date("9999-12-31T00:00:00Z")).getTime();
  const bEndTime = (bEnd ?? new Date("9999-12-31T00:00:00Z")).getTime();
  return aStart.getTime() <= bEndTime && bStart.getTime() <= aEndTime;
};

const sameTeam = (
  candidate: { projectId: string; teamId: string | null },
  row: Pick<PersonProjectAssignmentRow, "projectId" | "teamId">,
): boolean => {
  if (row.projectId !== candidate.projectId) return false;
  return (row.teamId ?? null) === (candidate.teamId ?? null);
};

export function validateNewAssignment(ctx: ValidateContext): ValidationResult {
  const { candidate, overlapping } = ctx;

  const overlappingRelevant = overlapping.filter((row) =>
    intervalsOverlap(
      startOfDay(candidate.validFrom),
      candidate.validTo ? endOfDay(candidate.validTo) : null,
      startOfDay(row.validFrom),
      row.validTo ? endOfDay(row.validTo) : null,
    ),
  );

  const sameSlot = overlappingRelevant.find((row) =>
    sameTeam(candidate, row),
  );
  if (sameSlot) {
    return {
      ok: false,
      code: "overlapSameProject",
      currentTotal: 0,
      conflictingPct: sameSlot.assignmentPct,
    };
  }

  const currentTotal = overlappingRelevant.reduce(
    (sum, row) => sum + row.assignmentPct,
    0,
  );

  if (currentTotal + candidate.assignmentPct > 100) {
    return {
      ok: false,
      code: "over100",
      currentTotal,
      conflictingPct: candidate.assignmentPct,
    };
  }

  if (candidate.validTo && candidate.validTo.getTime() < candidate.validFrom.getTime()) {
    return {
      ok: false,
      code: "endBeforeStart",
      currentTotal: 0,
      conflictingPct: 0,
    };
  }

  return { ok: true };
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(23, 59, 59, 999);
  return c;
}
