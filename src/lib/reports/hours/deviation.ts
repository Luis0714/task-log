import { roundToDecimals } from "@/lib/number/rounding";
import type {
  AssignmentPctLabel,
  SemaforoLevel,
} from "@/lib/reports/hours/hours-report-types";

export const DEVIATION_GREEN_MAX = 5;
export const DEVIATION_YELLOW_MAX = 20;

export type Deviation = Readonly<{
  pct: number | null;
  level: SemaforoLevel | null;
}>;

export function assignmentPctValue(label: AssignmentPctLabel): number | null {
  if (label.kind === "exception") return label.weightedPct;
  if (label.kind === "default") return 100;
  return null;
}

export function resolveDeviationSemaforo(deviationPct: number): SemaforoLevel {
  if (deviationPct <= DEVIATION_GREEN_MAX) return "verde";
  if (deviationPct <= DEVIATION_YELLOW_MAX) return "amarillo";
  return "rojo";
}

export function computeDeviation(
  assignmentPct: AssignmentPctLabel,
  compliancePct: number | null,
): Deviation {
  const assignment = assignmentPctValue(assignmentPct);
  if (assignment === null || compliancePct === null) {
    return { pct: null, level: null };
  }
  const pct = roundToDecimals(assignment - compliancePct, 1);
  return { pct, level: resolveDeviationSemaforo(pct) };
}
