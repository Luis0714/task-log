import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardPbiStateGroup } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type PbiStatusBreakdownProps = {
  groups: DashboardPbiStateGroup[];
  loading?: boolean;
  className?: string;
};

export function PbiStatusBreakdown({
  groups,
  loading = false,
  className,
}: PbiStatusBreakdownProps) {
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
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin estados de backlog disponibles.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {groups.map(({ state, items }) => (
              <li
                key={state}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground truncate">{state}</span>
                <span className="font-heading shrink-0 font-semibold tabular-nums">
                  {items.length}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
