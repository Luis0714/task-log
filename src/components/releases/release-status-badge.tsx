import { StatusDotBadge } from "@/components/shared/status-dot-badge";
import { isLastStageReady, releaseSummary } from "@/lib/releases/summary";
import type { ReleaseListItem } from "@/lib/releases/types";
import { cn } from "@/lib/utils";

export type ReleaseStatusBadgeProps = {
  item: ReleaseListItem;
};

export function ReleaseStatusBadge({ item }: ReleaseStatusBadgeProps) {
  const label = releaseSummary(item);
  const attention = item.pendingCount > 0 && !isLastStageReady(item);
  const ready = !attention && label.endsWith("listo");
  return (
    <StatusDotBadge
      label={label}
      className={cn(
        attention &&
          "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        ready &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        !attention &&
          !ready &&
          "border-border bg-muted/60 text-muted-foreground",
      )}
      dotClassName={
        attention ? "bg-amber-500" : ready ? "bg-emerald-500" : "bg-muted-foreground"
      }
    />
  );
}
