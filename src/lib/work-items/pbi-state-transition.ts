import { isCommittedPbiState } from "@/lib/azure-devops/work-items-filters";
import { isQaState } from "@/lib/dashboard/work-item-selectors";

export type PbiTransitionKind = "committed" | "qa" | "other";

export function getPbiTransitionKind(targetState: string): PbiTransitionKind {
  if (isCommittedPbiState(targetState)) return "committed";
  if (isQaState(targetState)) return "qa";
  return "other";
}

export function requiresCommittedDates(targetState: string): boolean {
  return getPbiTransitionKind(targetState) === "committed";
}

export function requiresQaResponsables(targetState: string): boolean {
  return getPbiTransitionKind(targetState) === "qa";
}
