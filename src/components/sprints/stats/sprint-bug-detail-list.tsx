"use client";

import { Bug } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdoWorkItemLink } from "@/components/work-items/ado-work-item-link";
import { WorkItemAssigneeLabel } from "@/components/work-items/work-item-assignee-tag";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { SprintBugDetailItem } from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export type SprintBugDetailListProps = {
  items: readonly SprintBugDetailItem[];
  project: string | null;
  className?: string;
};

function attendedBadgeVariant(isAttended: boolean) {
  return isAttended ? "secondary" : "destructive";
}

export function SprintBugDetailList({ items, project, className }: SprintBugDetailListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No hay bugs en el alcance seleccionado.</p>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/60", className)}>
      <div className="border-border/60 hidden border-b bg-muted/20 px-3 py-2 md:grid md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,10rem)_minmax(0,1fr)] md:gap-3">
        <span className="text-muted-foreground text-xs font-medium">Bug</span>
        <span className="text-muted-foreground text-xs font-medium">Título</span>
        <span className="text-muted-foreground text-xs font-medium">Asignado a</span>
        <span className="text-muted-foreground text-xs font-medium">Historia padre</span>
      </div>

      <ul className="divide-border/60 max-h-80 divide-y overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.workItemId}
            className="grid gap-2 px-3 py-2.5 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,10rem)_minmax(0,1fr)] md:items-center md:gap-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Bug className="text-destructive size-3.5 shrink-0 md:hidden" aria-hidden />
              <AdoWorkItemLink
                workItemId={item.workItemId}
                project={project}
                label={`#${item.workItemId}`}
              />
              <WorkItemStateBadge state={item.state} className="max-w-full shrink-0" />
              <Badge variant={attendedBadgeVariant(item.isAttended)} className="shrink-0">
                {item.isAttended ? "Atendido" : "Abierto"}
              </Badge>
            </div>

            <div className="min-w-0">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase md:hidden">
                Título
              </span>
              <p className="text-sm leading-snug text-pretty" title={item.title}>
                {item.title}
              </p>
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase md:hidden">
                Asignado a
              </span>
              <div className="mt-1 md:mt-0">
                <WorkItemAssigneeLabel
                  assignee={item.assignedTo}
                  className="w-fit max-w-full shrink-0 md:max-w-30 [&>span:last-child]:max-md:overflow-visible [&>span:last-child]:max-md:whitespace-normal md:[&>span:last-child]:truncate"
                />
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase md:hidden">
                Historia padre
              </span>
              {item.parentId ? (
                <div className="min-w-0">
                  <AdoWorkItemLink
                    workItemId={item.parentId}
                    project={project}
                    label={`HU #${item.parentId}`}
                  />
                  {item.parentTitle ? (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs" title={item.parentTitle}>
                      {item.parentTitle}
                    </p>
                  ) : null}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
