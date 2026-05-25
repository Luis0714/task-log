import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { HoursBreakdownLine } from "@/components/dashboard/metrics/hours-breakdown-line";
import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { totalHoursBreakdown, type HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { cn } from "@/lib/utils";

function formatHours(value: number, unit: string): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formatted}${unit}`;
}

export type MetricProgressCardProps = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  hint?: string;
  /** Desglose task / bug debajo del total. */
  hoursBreakdown?: HoursBreakdown;
  /** Contenido debajo de la barra de progreso (p. ej. horas pendientes). */
  footer?: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
};

export function MetricProgressCard({
  label,
  current,
  target,
  unit = "h",
  hint,
  hoursBreakdown,
  footer,
  icon: Icon,
  loading = false,
  className,
}: MetricProgressCardProps) {
  const valueLabel = `${formatHours(current, unit)} / ${formatHours(target, unit)}`;
  const breakdownTotal = hoursBreakdown ? totalHoursBreakdown(hoursBreakdown) : 0;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          {Icon ? (
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>

        {loading ? (
          <>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </>
        ) : (
          <>
            <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
              {valueLabel}
            </p>
            {hoursBreakdown && breakdownTotal > 0 ? (
              <HoursBreakdownLine breakdown={hoursBreakdown} />
            ) : null}
            <ProgressBar value={current} max={target} />
            {footer ?? null}
          </>
        )}

        {hint && !loading ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
