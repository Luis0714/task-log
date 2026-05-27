import { Clock, UserRound } from "lucide-react";

import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { StatusBadge } from "@/components/tasks/status-badge";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type TaskSummaryCardProps = {
  item: AdoWorkItemOptionDto;
  showLoggedHoursHighlight?: boolean;
  className?: string;
};

type TaskSummaryViewModel = {
  hasWorkingDate: boolean;
  hasEffort: boolean;
  hasState: boolean;
  hasAssignee: boolean;
  shouldShowLoggedHoursHighlight: boolean;
};

function isValidLoggedHours(hours: number | undefined): hours is number {
  return hours !== undefined && Number.isFinite(hours) && hours >= 0;
}

function buildTaskSummaryViewModel(
  item: AdoWorkItemOptionDto,
  showLoggedHoursHighlight: boolean,
): TaskSummaryViewModel {
  return {
    hasWorkingDate: Boolean(item.workingDate),
    hasEffort: item.effort !== undefined,
    hasState: Boolean(item.state),
    hasAssignee: Boolean(item.assignedTo),
    shouldShowLoggedHoursHighlight: showLoggedHoursHighlight && isValidLoggedHours(item.loggedHours),
  };
}

export function TaskLoggedHoursHighlight({
  hours,
  className,
}: {
  hours: number;
  className?: string;
}) {
  if (!Number.isFinite(hours) || hours < 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/12 px-3 py-2.5 shadow-sm ring-1 ring-amber-500/25 dark:bg-amber-500/15",
        className,
      )}
      title={`Horas registradas: ${formatHours(hours)}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/20 text-amber-800 dark:text-amber-300">
        <Clock className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] leading-none font-semibold tracking-widest uppercase">
          Horas registradas
        </p>
        <p className="font-heading mt-1 text-xl font-semibold leading-none tracking-tight text-amber-900 tabular-nums dark:text-amber-200">
          {formatHours(hours)}
        </p>
      </div>
    </div>
  );
}

export function TaskSummaryCard({
  item,
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
          <WorkItemId id={item.id} />
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
