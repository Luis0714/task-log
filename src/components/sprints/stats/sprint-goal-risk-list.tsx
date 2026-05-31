"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getSprintStoryGoalStatusLabel } from "@/lib/sprints/sprint-snapshot-display";
import type { SprintGoalRiskItem } from "@/lib/sprints/sprint-stats-types";

export type SprintGoalRiskListProps = {
  items: readonly SprintGoalRiskItem[];
  loading?: boolean;
};

function statusVariant(status: SprintGoalRiskItem["goalStatus"]) {
  if (status === "missed") return "destructive" as const;
  if (status === "partial") return "secondary" as const;
  return "outline" as const;
}

export function SprintGoalRiskList({ items, loading = false }: SprintGoalRiskListProps) {
  if (loading) {
    return (
      <DashboardSection
        title="Requieren atención"
        description="Historias con meta parcial o no cumplida."
      >
        <div className="divide-border/60 divide-y rounded-lg border border-border/60">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 px-3 py-2.5">
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      title="Requieren atención"
      description="Historias con meta parcial o no cumplida en el objetivo del sprint."
    >
      <ul className="divide-border/60 divide-y rounded-lg border border-border/60">
        {items.map((item) => (
          <li key={item.workItemId} className="flex items-start gap-3 px-3 py-2.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">#{item.workItemId}</span>
                <Badge variant={statusVariant(item.goalStatus)}>
                  {getSprintStoryGoalStatusLabel(item.goalStatus)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-pretty">{item.title}</p>
              <p className="text-muted-foreground text-xs">
                {item.assignedTo ? item.assignedTo : "Sin asignar"}
                {item.targetStateName
                  ? ` · Meta: ${item.targetStateName}`
                  : ""}
                {item.finalStateName
                  ? ` · Actual: ${item.finalStateName}`
                  : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
