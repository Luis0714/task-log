import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStatusCount } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type PbiStatusBreakdownProps = {
  items: DashboardStatusCount[];
  loading?: boolean;
  className?: string;
};

export function PbiStatusBreakdown({ items, loading = false, className }: PbiStatusBreakdownProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Estado PBIs
        </p>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-heading font-semibold tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
