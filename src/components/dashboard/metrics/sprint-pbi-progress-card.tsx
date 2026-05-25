import { CheckCircle2, CircleDashed, ListChecks } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintPbiProgress } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const RING_RADIUS = 52;
const RING_STROKE = 10;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export type SprintPbiProgressCardProps = {
  progress: SprintPbiProgress;
  loading?: boolean;
  className?: string;
};

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="shrink-0 -rotate-90"
      role="img"
      aria-label={`Progreso del sprint: ${clamped} por ciento`}
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        className="stroke-muted"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
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
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", toneClass)} aria-hidden />
        {label}
      </span>
      <span className="font-heading font-semibold tabular-nums">{count}</span>
    </li>
  );
}

export function SprintPbiProgressCard({
  progress,
  loading = false,
  className,
}: SprintPbiProgressCardProps) {
  const hasItems = progress.totalCount > 0;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Progreso PBIs del sprint
          </p>
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ListChecks className="size-4" aria-hidden />
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="size-[124px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-5 w-3/5" />
            </div>
          </div>
        ) : !hasItems ? (
          <p className="text-muted-foreground text-sm">
            No tienes PBIs asignadas en este sprint para calcular el progreso.
          </p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative mx-auto flex shrink-0 items-center justify-center sm:mx-0">
              <ProgressRing percent={progress.percent} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                  {progress.percent}%
                </span>
                <span className="text-muted-foreground text-xs">
                  {progress.completedCount}/{progress.totalCount}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <ul className="space-y-2">
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
                    label="Otros estados"
                    count={progress.otherCount}
                    tone="other"
                  />
                ) : null}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
