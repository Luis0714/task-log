import { isHumanReviewPolicy } from "@/lib/review-times/policy-types";
import type { PolicySignal, ReadyState } from "@/lib/review-times/types";

export type ReadyForApproval = {
  readyState: ReadyState;
  readyAt: string | null;
};

function isSatisfied(status: string): boolean {
  const raw = status.trim().toLowerCase();
  return raw === "approved" || raw === "completed";
}

function isIgnored(status: string): boolean {
  return status.trim().toLowerCase() === "notapplicable";
}

function latest(dates: readonly string[]): string | null {
  let winner: string | null = null;
  for (const date of dates) {
    if (!Number.isFinite(Date.parse(date))) continue;
    if (!winner || Date.parse(date) > Date.parse(winner)) winner = date;
  }
  return winner;
}

function automaticPolicies(policies: readonly PolicySignal[]): PolicySignal[] {
  return policies.filter((policy) => {
    if (!policy.isEnabled || !policy.isBlocking) return false;
    if (isHumanReviewPolicy(policy.typeId)) return false;
    if (isIgnored(policy.status)) return false;
    return true;
  });
}

export function resolveReadyAt(policies: readonly PolicySignal[]): ReadyForApproval {
  const automatic = automaticPolicies(policies);
  if (automatic.length === 0) return { readyState: "none", readyAt: null };
  if (automatic.some((policy) => !isSatisfied(policy.status))) {
    return { readyState: "pending", readyAt: null };
  }
  return {
    readyState: "ready",
    readyAt: latest(automatic.map((policy) => policy.completedAt ?? "")),
  };
}
