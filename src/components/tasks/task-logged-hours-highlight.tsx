import { Clock } from "lucide-react";

import { formatHours } from "@/lib/dashboard/format-hours";
import { cn } from "@/lib/utils";

export type TaskLoggedHoursHighlightProps = {
  hours: number;
  className?: string;
};

export function isValidLoggedHours(hours: number | undefined): hours is number {
  return hours !== undefined && Number.isFinite(hours) && hours >= 0;
}

export function TaskLoggedHoursHighlight({ hours, className }: TaskLoggedHoursHighlightProps) {
  if (!isValidLoggedHours(hours)) return null;

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
