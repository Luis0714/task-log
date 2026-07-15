"use client";

import { Bug, CalendarOff, Clock, ListChecks } from "lucide-react";

import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";
import { cn } from "@/lib/utils";

export type SprintTimesDevHoursValueProps = {
  value: number;
  className?: string;
};

export function SprintTimesDevHoursValue({ value, className }: SprintTimesDevHoursValueProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 text-xs tabular-nums",
        className,
      )}
    >
      <ListChecks className="text-chart-1 size-3 shrink-0 overflow-visible" aria-hidden />
      <span>{formatHours(value)}</span>
    </span>
  );
}

export type SprintTimesBugHoursValueProps = {
  value: number;
  className?: string;
};

export function SprintTimesBugHoursValue({ value, className }: SprintTimesBugHoursValueProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 text-xs tabular-nums",
        className,
      )}
    >
      <Bug className="size-3 shrink-0" style={{ color: "var(--bug-open)" }} aria-hidden />
      <span>{formatHours(value)}</span>
    </span>
  );
}

export type SprintTimesTotalCellProps = {
  breakdown: HoursBreakdown;
  className?: string;
};

export function SprintTimesTotalCell({ breakdown, className }: SprintTimesTotalCellProps) {
  const total = totalHoursBreakdown(breakdown);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-foreground inline-flex items-center gap-1 text-xs font-semibold tabular-nums">
        <Clock className="text-primary/80 size-3 shrink-0" aria-hidden />
        <span>{formatHours(total)}</span>
      </span>
      <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
        <SprintTimesDevHoursValue
          value={breakdown.taskHours}
          className="text-muted-foreground text-[10px] [&_svg]:size-2.5"
        />
        <SprintTimesBugHoursValue
          value={breakdown.bugHours}
          className="text-muted-foreground text-[10px] [&_svg]:size-2.5"
        />
      </div>
    </div>
  );
}

export type SprintTimesLegendProps = {
  className?: string;
};

export function SprintTimesDevSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      <ListChecks className="text-chart-1 size-3 shrink-0 overflow-visible" aria-hidden />
      Desarrollo
    </span>
  );
}

export function SprintTimesBugSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      <Bug className="size-3 shrink-0" style={{ color: "var(--bug-open)" }} aria-hidden />
      Bugs
    </span>
  );
}

export function SprintTimesWeekTotalValue({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "text-foreground inline-flex items-center justify-center gap-1 text-xs font-semibold tabular-nums",
        className,
      )}
    >
      <Clock className="text-primary/80 size-3 shrink-0" aria-hidden />
      <span>{formatHours(value)}</span>
    </span>
  );
}

export function SprintTimesTotalSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      <Clock className="text-primary/80 size-3 shrink-0" aria-hidden />
      Total
    </span>
  );
}

export function SprintTimesLegend({ className }: SprintTimesLegendProps) {
  return (
    <div className={cn("text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-[11px]", className)}>
      <span className="inline-flex items-center gap-1">
        <ListChecks className="text-chart-1 size-3 shrink-0 overflow-visible" aria-hidden />
        Tiempo desarrollo
      </span>
      <span className="inline-flex items-center gap-1">
        <Bug className="size-3 shrink-0" style={{ color: "var(--bug-open)" }} aria-hidden />
        Tiempo en bugs
      </span>
      <span className="inline-flex items-center gap-1">
        <CalendarOff className="size-3 shrink-0" aria-hidden />
        Tiempo en novedades
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="text-primary/80 size-3 shrink-0" aria-hidden />
        Total sprint
      </span>
    </div>
  );
}

export function SprintTimesNewsHoursValue({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 text-xs tabular-nums",
        className,
      )}
    >
      <CalendarOff className="size-3 shrink-0" style={{ color: "var(--bug-open)" }} aria-hidden />
      <span>{formatHours(value)}</span>
    </span>
  );
}

export function SprintTimesNewsSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      <CalendarOff className="size-3 shrink-0" style={{ color: "var(--bug-open)" }} aria-hidden />
      Novedades
    </span>
  );
}

export function SprintTimesExpectedHoursValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-xs tabular-nums",
        className,
      )}
    >
      <span>{formatHours(value)}</span>
    </span>
  );
}

export function SprintTimesExpectedHoursSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      Esperadas
    </span>
  );
}

export function SprintTimesComplianceBadge({
  level,
  pct,
  className,
}: {
  level: SemaforoLevel | null;
  pct: number | null;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <ReportsTimeLogSemaforoBadge level={level} pct={pct} />
    </div>
  );
}

export function SprintTimesComplianceSubColumnHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      Cumpl.
    </span>
  );
}
