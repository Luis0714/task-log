"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import { SprintGoalObjectiveMetaActual } from "@/components/sprints/stats/sprint-goal-objective-field-badges";
import { SprintGoalStatusBadge } from "@/components/sprints/goal/sprint-goal-status-badge";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import type { SprintGoalObjectiveItem } from "@/lib/sprints/sprint-stats-types";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";
import { cn } from "@/lib/utils";

export type SprintGoalRiskListProps = {
  items: readonly SprintGoalObjectiveItem[];
  loading?: boolean;
};

const SECTION_TITLE = "Historias del objetivo";
const SECTION_DESCRIPTION =
  "Todas las historias comprometidas en el objetivo del sprint: cumplidas, en proceso (parciales) y no cumplidas.";

function rowIcon(status: SprintStoryGoalStatus) {
  if (status === "achieved") {
    return (
      <CheckCircle2
        className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
    );
  }
  if (status === "partial") {
    return (
      <CircleDashed
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
    );
  }
  return (
    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
  );
}

function SprintGoalObjectiveRow({ item }: { item: SprintGoalObjectiveItem }) {
  const hasEffort = item.effort !== null && Number.isFinite(item.effort);

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-3 py-3",
        item.goalStatus === "achieved" && "bg-emerald-500/3",
        item.goalStatus === "partial" && "bg-amber-500/3",
        item.goalStatus === "missed" && "bg-destructive/3",
      )}
    >
      {rowIcon(item.goalStatus)}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">#{item.workItemId}</span>
          <SprintGoalStatusBadge status={item.goalStatus} />
          {hasEffort ? <WorkItemEffortBadge effort={item.effort!} className="shrink-0" /> : null}
        </div>
        <p className="text-sm font-medium text-pretty">{item.title}</p>
        <SprintGoalObjectiveMetaActual
          targetStateName={item.targetStateName}
          targetTacTagName={item.targetTacTagName}
          finalStateName={item.finalStateName}
          finalTacTagName={item.finalTacTagName}
        />
        <p className="text-muted-foreground text-xs">
          {item.assignedTo?.trim() ? item.assignedTo : "Sin asignar"}
        </p>
      </div>
    </li>
  );
}

export function SprintGoalRiskList({ items, loading = false }: SprintGoalRiskListProps) {
  if (loading) {
    return (
      <DashboardSection title={SECTION_TITLE} description={SECTION_DESCRIPTION}>
        <div className="divide-border/60 divide-y rounded-lg border border-border/60">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3 px-3 py-3">
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title={SECTION_TITLE} description={SECTION_DESCRIPTION}>
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm">
          No hay historias comprometidas con meta definida en el objetivo del sprint.
        </p>
      ) : (
        <ul className="divide-border/60 divide-y rounded-lg border border-border/60">
          {items.map((item) => (
            <SprintGoalObjectiveRow key={item.workItemId} item={item} />
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
