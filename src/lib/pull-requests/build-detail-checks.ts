import type {
  AdoPolicyEvaluation,
  AdoPullRequestStatus,
} from "@/lib/azure-devops/pull-request-detail";
import type {
  PullRequestCheckState,
  PullRequestDetailCheck,
  PullRequestDetailReviewer,
} from "@/lib/pull-requests/detail-types";
import { isApprovedVote } from "@/lib/pull-requests/vote";

function mapPolicyState(status: string | undefined): PullRequestCheckState {
  const raw = (status ?? "").toLowerCase();
  if (raw === "approved" || raw === "completed") return "succeeded";
  if (raw === "rejected" || raw === "broken" || raw === "failed") return "failed";
  return "pending";
}

function mapStatusState(state: string | undefined): PullRequestCheckState {
  const raw = (state ?? "").toLowerCase();
  if (raw === "succeeded" || raw === "ok") return "succeeded";
  if (raw === "failed" || raw === "error") return "failed";
  return "pending";
}

function combinedLabel(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isCoverageCheck(label: string): boolean {
  return label.includes("coverage");
}

function isBuildCheck(label: string): boolean {
  if (!label || isCoverageCheck(label)) return false;
  return (
    label.includes("build") ||
    label.includes("pipeline") ||
    label.includes("continuous-integration") ||
    label.includes("continuous integration")
  );
}

function statusLabel(status: AdoPullRequestStatus): string {
  return status.context?.name?.trim() || status.description?.trim() || "Build";
}

function policyLabel(policy: AdoPolicyEvaluation): string {
  return (
    policy.configuration?.displayName?.trim() ||
    policy.configuration?.type?.displayName?.trim() ||
    "Build"
  );
}

export function buildDetailChecks(input: {
  hasConflicts: boolean;
  lifecycleStatus: "active" | "completed" | "abandoned";
  reviewers: readonly PullRequestDetailReviewer[];
  statuses: readonly AdoPullRequestStatus[];
  policies: readonly AdoPolicyEvaluation[];
}): PullRequestDetailCheck[] {
  const checks: PullRequestDetailCheck[] = [];
  const seen = new Set<string>();

  const push = (check: PullRequestDetailCheck) => {
    const key = check.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    checks.push(check);
  };

  for (const policy of input.policies) {
    const label = policyLabel(policy);
    const haystack = combinedLabel(
      label,
      policy.configuration?.type?.displayName,
    );
    if (!isBuildCheck(haystack)) continue;
    push({
      id: policy.evaluationId || `policy-${label}`,
      label,
      state: mapPolicyState(policy.status),
    });
  }

  for (const status of input.statuses) {
    const label = statusLabel(status);
    const haystack = combinedLabel(
      label,
      status.context?.name,
      status.context?.genre,
      status.description,
    );
    if (!isBuildCheck(haystack)) continue;
    push({
      id: status.id != null ? `status-${status.id}` : `status-${label}`,
      label,
      state: mapStatusState(status.state),
    });
  }

  const required = input.reviewers.filter((reviewer) => reviewer.isRequired);
  if (required.length > 0) {
    const approved = required.every((reviewer) => isApprovedVote(reviewer.vote));
    push({
      id: "required-review",
      label: approved ? "Revisión requerida aprobada" : "Revisión requerida",
      state: approved ? "succeeded" : "pending",
    });
  }

  if (input.hasConflicts) {
    push({
      id: "merge-conflicts",
      label: "Hay conflictos de fusión",
      state: "failed",
    });
  } else if (input.lifecycleStatus !== "abandoned") {
    push({
      id: "merge-conflicts",
      label: "Sin conflictos de fusión",
      state: "succeeded",
    });
  }

  return checks;
}
