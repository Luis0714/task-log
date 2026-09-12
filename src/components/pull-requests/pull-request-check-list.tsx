import { PullRequestCheckItem } from "@/components/pull-requests/pull-request-check-item";
import type { PullRequestDetailCheck } from "@/lib/pull-requests/detail-types";

export type PullRequestCheckListProps = {
  checks: readonly PullRequestDetailCheck[];
};

export function PullRequestCheckList({ checks }: PullRequestCheckListProps) {
  if (checks.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card px-3 py-2">
      <ul>
        {checks.map((check) => (
          <PullRequestCheckItem key={check.id} check={check} />
        ))}
      </ul>
    </section>
  );
}
