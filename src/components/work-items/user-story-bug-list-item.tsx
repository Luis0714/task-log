"use client";

import { AdoWorkItemLink } from "@/components/work-items/ado-work-item-link";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { getWorkItemStatePresentation } from "@/lib/time-log/work-item-presentation";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type UserStoryBugListItemProps = {
  bug: AdoWorkItemOptionDto;
  project: string | null;
  onClick?: (bug: AdoWorkItemOptionDto) => void;
};

export function UserStoryBugListItem({ bug, project, onClick }: UserStoryBugListItemProps) {
  const presentation = bug.state ? getWorkItemStatePresentation(bug.state) : null;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30",
        !presentation && "border-border/60 bg-muted/20",
      )}
      onClick={() => onClick?.(bug)}
      disabled={!onClick}
      style={presentation?.surfaceStyle}
    >
      <div className="min-w-0 flex-1">
        <AdoWorkItemLink workItemId={bug.id} project={project} label={`Bug #${bug.id}`} />
        <p className="text-foreground mt-1.5 text-sm leading-snug" title={bug.title}>
          {bug.title}
        </p>
      </div>
      {bug.state ? (
        <WorkItemStateBadge state={bug.state} className="max-w-[42%] shrink-0" />
      ) : null}
    </button>
  );
}
