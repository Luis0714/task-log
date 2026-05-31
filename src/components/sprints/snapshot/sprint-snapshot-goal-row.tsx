"use client";

import { UserRound } from "lucide-react";

import { SprintSnapshotGoalStatusBadge } from "@/components/sprints/snapshot/sprint-snapshot-goal-status-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemTagsReadonly } from "@/components/work-items/work-item-tags-readonly";
import type { SprintStorySnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { cn } from "@/lib/utils";

export type SprintSnapshotGoalRowProps = {
  story: SprintStorySnapshotData;
};

function SnapshotAssignee({ assignedTo }: { assignedTo: string | null }) {
  if (assignedTo?.trim()) {
    return <span className="text-muted-foreground text-xs whitespace-nowrap">{assignedTo}</span>;
  }

  return (
    <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap">
      <UserRound className="size-3 shrink-0" aria-hidden />
      <span>Sin asignar</span>
    </span>
  );
}

function SnapshotFieldValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      {value?.trim() ? (
        <p className="text-sm">{value}</p>
      ) : (
        <p className="text-muted-foreground text-sm">—</p>
      )}
    </div>
  );
}

export function SprintSnapshotGoalRow({ story }: SprintSnapshotGoalRowProps) {
  const hasEffort = story.effort !== null && Number.isFinite(story.effort);
  const finalTags = story.finalTacTagName ? [story.finalTacTagName] : [];

  return (
    <tr
      className={cn(
        "border-b border-border/60 align-top",
        !story.includedInGoal && "bg-muted/20 opacity-80",
      )}
    >
      <td className="px-3 py-3 align-top">
        <div className="flex min-w-80 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <WorkItemId id={story.workItemId} className="shrink-0" />
            {story.finalStateName ? (
              <WorkItemStateBadge state={story.finalStateName} className="shrink-0" />
            ) : (
              <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
                Sin estado
              </span>
            )}
            <SnapshotAssignee assignedTo={story.assignedTo} />
            {hasEffort ? (
              <WorkItemEffortBadge effort={story.effort!} className="shrink-0" />
            ) : null}
            <SprintSnapshotGoalStatusBadge status={story.goalStatus} />
          </div>
          <p className="text-sm font-medium whitespace-nowrap" title={story.title}>
            {story.title}
          </p>
          <WorkItemTagsReadonly tags={finalTags} />
        </div>
      </td>

      <td className="min-w-32 px-3 py-3 align-top">
        <SnapshotFieldValue label="Baseline" value={story.baselineStateName} />
      </td>

      <td className="min-w-32 px-3 py-3 align-top">
        <SnapshotFieldValue label="Objetivo" value={story.targetStateName} />
      </td>

      <td className="min-w-32 px-3 py-3 align-top">
        <SnapshotFieldValue label="Final" value={story.finalStateName} />
      </td>

      <td className="min-w-36 px-3 py-3 align-top">
        <SnapshotFieldValue label="TAC baseline" value={story.baselineTacTagName} />
      </td>

      <td className="min-w-36 px-3 py-3 align-top">
        <SnapshotFieldValue label="TAC objetivo" value={story.targetTacTagName} />
      </td>

      <td className="min-w-36 px-3 py-3 align-top">
        <SnapshotFieldValue label="TAC final" value={story.finalTacTagName} />
      </td>
    </tr>
  );
}
