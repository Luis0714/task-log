import { CheckCircle2, CircleDashed, ListChecks } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintPbiProgress } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const RING_RADIUS_COMPACT = 40;
const RING_RADIUS_DEFAULT = 48;
const RING_STROKE = 8;

function ringSize(compact: boolean) {
  const radius = compact ? RING_RADIUS_COMPACT : RING_RADIUS_DEFAULT;
  const size = (radius + RING_STROKE) * 2;
  const circumference = 2 * Math.PI * radius;
  return { radius, size, circumference };
}

export type SprintPbiProgressCardProps = {
  progress: SprintPbiProgress;
  loading?: boolean;
  compact?: boolean;
  highlight?: boolean;
  className?: string;
};

function ProgressRing({ percent, compact }: { percent: number; compact: boolean }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const { radius, size, circumference } = ringSize(compact);
  const offset = circumference - (clamped / 100) * circumference;
  const cx = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      role="img"
      aria-label={`Progreso del sprint: ${clamped} por ciento`}
    >
      <circle
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

type BreakdownRowProps = {
  icon: typeof CheckCircle2;
  label: string;
  count: number;
  tone: "done" | "pending" | "other";
};

function BreakdownRow({ icon: Icon, label, count, tone }: BreakdownRowProps) {
  const toneClass =
    tone === "done"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "pending"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Icon className={cn("size-3.5 shrink-0", toneClass)} aria-hidden />
        {label}
      </span>
      <span className="font-heading font-semibold tabular-nums">{count}</span>
    </li>
  );
}

export function SprintPbiProgressCard({
  progress,
  loading = false,
  compact = false,
  highlight = false,
  className,
}: SprintPbiProgressCardProps) {
  const hasItems = progress.totalCount > 0;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors",
        highlight
          ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/15"
          : "hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 pt-0">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Progreso PBIs
        </p>

        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ) : !hasItems ? (
          <p className="text-muted-foreground text-sm">
            Sin PBIs asignadas en este sprint.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative flex shrink-0 items-center justify-center">
              <ProgressRing percent={progress.percent} compact={compact} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "font-heading font-semibold tracking-tight tabular-nums",
                    compact ? "text-2xl" : "text-3xl",
                  )}
                >
                  {progress.percent}%
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {progress.completedCount}/{progress.totalCount}
                </span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-1">
              <BreakdownRow
                icon={CheckCircle2}
                label="Desarrolladas"
                count={progress.completedCount}
                tone="done"
              />
              <BreakdownRow
                icon={CircleDashed}
                label="Pendientes"
                count={progress.pendingCount}
                tone="pending"
              />
              {progress.otherCount > 0 ? (
                <BreakdownRow
                  icon={ListChecks}
                  label="Otros"
                  count={progress.otherCount}
                  tone="other"
                />
              ) : null}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
