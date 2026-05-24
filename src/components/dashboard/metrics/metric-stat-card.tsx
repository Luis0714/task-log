import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
};

export function MetricStatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
  className,
}: MetricStatCardProps) {
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
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        )}

        {hint && !loading ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
