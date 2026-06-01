import type { LucideIcon } from "lucide-react";

import { PbiProgressRingChart } from "@/components/dashboard/charts/pbi-progress-ring-chart";
import { ProgressRingBreakdownRow } from "@/components/dashboard/metrics/progress-ring/progress-ring-breakdown-row";
import { ProgressRingSkeleton } from "@/components/dashboard/metrics/progress-ring/progress-ring-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgressRingViewModel } from "@/lib/dashboard/progress-ring/types";
import { cn } from "@/lib/utils";

export type ProgressRingCardProps = {
  model: ProgressRingViewModel;
  iconsByItemId: Record<string, LucideIcon>;
  loading?: boolean;
  highlight?: boolean;
  className?: string;
};

export function ProgressRingCard({
  model,
  iconsByItemId,
  loading = false,
  highlight,
  className,
}: ProgressRingCardProps) {
  const isHighlighted = highlight ?? model.highlight;
  const hasItems = model.totalCount > 0;

  return (
    <Card
      size="sm"
      className={cn(
        "h-full border-border/60 dark:border-white/6 transition-colors",
        isHighlighted
          ? "border-primary/30 bg-primary/3 ring-1 ring-primary/15"
          : "hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex h-full flex-1 flex-col justify-center gap-2 pt-0">
        {model.title ? (
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {model.title}
          </p>
        ) : null}

        {loading ? (
          <ProgressRingSkeleton rowCount={model.breakdown.length || 3} />
        ) : !hasItems ? (
          <p className="text-muted-foreground text-sm">{model.emptyMessage}</p>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex shrink-0 items-center justify-center">
              <PbiProgressRingChart percent={model.percent} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-lg font-semibold leading-none tracking-tight tabular-nums sm:text-xl md:text-[22px]">
                  {model.percent}%
                </span>
                <span className="text-muted-foreground text-[9px] sm:text-[10px]">
                  {model.completedCount}/{model.totalCount}
                </span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-1">
              {model.breakdown.map((item) => {
                const Icon = iconsByItemId[item.id];
                if (!Icon) return null;

                return <ProgressRingBreakdownRow key={item.id} item={item} icon={Icon} />;
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
