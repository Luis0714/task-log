import { UserRound } from "lucide-react";

import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { TaskLoggedHoursHighlight } from "@/components/tasks/task-logged-hours-highlight";
import { buildTaskSummaryViewModel } from "@/components/tasks/task-summary-card.viewmodel";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { AdoWorkItemLink } from "@/components/work-items/ado-work-item-link";
import { StatusBadge } from "@/components/tasks/status-badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type TaskSummaryCardProps = {
  item: AdoWorkItemOptionDto;
  project: string | null;
  showLoggedHoursHighlight?: boolean;
  className?: string;
};

export function TaskSummaryCard({
  item,
  project,
  showLoggedHoursHighlight = true,
  className,
}: TaskSummaryCardProps) {
  const viewModel = buildTaskSummaryViewModel(item, showLoggedHoursHighlight);

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "dark:border-white/6 dark:bg-card/90",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AdoWorkItemLink workItemId={item.id} project={project} label={`#${item.id}`} />
          {viewModel.hasWorkingDate ? <TaskDateBadge dateKey={item.workingDate!} /> : null}
          {viewModel.hasEffort ? <WorkItemEffortBadge effort={item.effort!} /> : null}
        </div>
        {viewModel.hasState ? (
          <StatusBadge state={item.state!} className="max-w-[50%] shrink-0" />
        ) : null}
      </div>

      {viewModel.hasAssignee ? (
        <div className="mt-3 flex min-w-0 items-center gap-2.5">
          <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25">
            <UserRound className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[10px] leading-none font-semibold tracking-widest uppercase">
              Asignado a
            </p>
            <p
              className="text-foreground mt-1 text-sm leading-tight"
              title={item.assignedTo}
            >
              {item.assignedTo}
            </p>
          </div>
        </div>
      ) : null}

      {viewModel.shouldShowLoggedHoursHighlight ? (
        <TaskLoggedHoursHighlight hours={item.loggedHours!} className="mt-3" />
      ) : null}
    </div>
  );
}
