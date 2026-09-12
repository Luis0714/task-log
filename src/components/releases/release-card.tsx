"use client";

import { ReleaseBranchLabel } from "@/components/releases/release-branch-label";
import { ReleaseStageStepper } from "@/components/releases/release-stage-stepper";
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge";
import { RelativeTimeLabel } from "@/components/shared/relative-time-label";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import type { ReleaseListItem, ReleaseStage } from "@/lib/releases/types";
import { cn } from "@/lib/utils";

export type ReleaseCardProps = {
  item: ReleaseListItem;
  disabled?: boolean;
  onApprove?: (item: ReleaseListItem, stage: ReleaseStage) => void;
};

export function ReleaseCard({ item, disabled, onApprove }: ReleaseCardProps) {
  return (
    <article
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left",
        "hover:border-border/80 hover:bg-muted/30",
      )}
    >
      <div className="flex items-start gap-3">
        <TeamMemberAvatar name={item.createdBy} size="default" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{item.name}</h2>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <ReleaseBranchLabel
                  branch={item.branch}
                  author={item.createdBy}
                  className="min-w-0"
                />
                <RelativeTimeLabel isoDate={item.createdAt} />
              </div>
            </div>
            <ReleaseStatusBadge item={item} />
          </div>
        </div>
      </div>

      <ReleaseStageStepper
        stages={item.stages}
        disabled={disabled}
        onApprove={(stage) => onApprove?.(item, stage)}
      />
    </article>
  );
}
