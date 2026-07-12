import type { AssignmentSegment } from "@/lib/reports/hours/compute-expected-hours";

export type AssignmentForSegment = {
  assignmentPct: number;
  validFrom: string;
  validTo: string | null;
};

export type ResolveAssignmentSegmentsArgs = {
  assignments: readonly AssignmentForSegment[];
  periodStart: string;
  periodEnd: string;
  hasInferredDefault: boolean;
};

export function resolveAssignmentSegments(
  args: ResolveAssignmentSegmentsArgs,
): AssignmentSegment[] {
  const { assignments, periodStart, periodEnd, hasInferredDefault } = args;

  if (assignments.length === 0 && !hasInferredDefault) {
    return [];
  }

  if (assignments.length === 0) {
    return [{ pct: 100, from: periodStart, to: null }];
  }

  const segments: AssignmentSegment[] = [];

  for (const a of assignments) {
    if (a.validFrom > periodEnd) continue;
    if (a.validTo !== null && a.validTo < periodStart) continue;
    segments.push({
      pct: a.assignmentPct,
      from: a.validFrom,
      to: a.validTo,
    });
  }

  return segments.sort((x, y) => x.from.localeCompare(y.from));
}