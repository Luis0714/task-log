import { StatusDotBadge } from "@/components/shared/status-dot-badge";
import { PULL_REQUEST_STATUS_TONES } from "@/lib/pull-requests/status";
import type { PullRequestVoteStatus } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

export type PullRequestStatusBadgeProps = {
  status: PullRequestVoteStatus;
  summary?: string | null;
  className?: string;
};

export function PullRequestStatusBadge({
  status,
  summary,
  className,
}: PullRequestStatusBadgeProps) {
  const tone = PULL_REQUEST_STATUS_TONES[status];
  return (
    <StatusDotBadge
      label={summary ?? tone.label}
      className={cn(tone.className, className)}
      dotClassName={tone.dotClassName}
    />
  );
}
