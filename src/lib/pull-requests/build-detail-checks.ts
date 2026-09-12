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

function statusLabel(status: AdoPullRequestStatus): string {
  const name = status.context?.name?.trim() || status.description?.trim() || "Comprobación";
  if (status.description?.trim() && status.description.trim() !== name) {
    return `${name}: ${status.description.trim()}`;
  }
  return name;
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
    const label =
      policy.configuration?.displayName?.trim() ||
      policy.configuration?.type?.displayName?.trim();
    if (!label) continue;
    push({
      id: policy.evaluationId || `policy-${label}`,
      label,
      state: mapPolicyState(policy.status),
    });
  }

  for (const status of input.statuses) {
    push({
      id: status.id != null ? `status-${status.id}` : `status-${statusLabel(status)}`,
      label: statusLabel(status),
      state: mapStatusState(status.state),
    });
  }

  for (const reviewer of input.reviewers.filter((item) => item.isRequired)) {
    const approved = isApprovedVote(reviewer.vote);
    push({
      id: `reviewer-${reviewer.id}`,
      label: approved
        ? `${reviewer.displayName} aprobó`
        : `${reviewer.displayName} debe aprobar`,
      state: approved ? "succeeded" : "pending",
    });
  }

  if (input.hasConflicts) {
    push({
      id: "merge-conflicts",
      label: "Hay conflictos de fusión",
      state: "failed",
    });
  } else if (input.lifecycleStatus === "completed") {
    push({
      id: "merge-conflicts",
      label: "Sin conflictos de fusión",
      state: "succeeded",
    });
  } else if (input.lifecycleStatus === "active") {
    push({
      id: "merge-conflicts",
      label: "Sin conflictos de fusión",
      state: "succeeded",
    });
  }

  return checks;
}
