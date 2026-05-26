import { PbiCompactRow } from "@/components/dashboard/work-items/pbi-compact-row";
import { PbiFeaturedCard } from "@/components/dashboard/work-items/pbi-featured-card";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type PbiListProps = {
  items: DashboardWorkItem[];
  variant?: "featured" | "compact";
  showHours?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: DashboardWorkItem) => void;
};

export function PbiList({
  items,
  variant = "compact",
  showHours = false,
  loading = false,
  emptyMessage = "No hay historias de usuario para mostrar.",
  className,
  itemClassName,
  onItemClick,
}: PbiListProps) {
  if (loading) {
    return <PbiListSkeleton variant={variant} />;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  if (variant === "featured") {
    return (
      <div className={cn("@container grid grid-cols-1 gap-3 @md:grid-cols-2", className)}>
        {items.map((item) => (
          <PbiFeaturedCard
            key={item.id}
            item={item}
            className={itemClassName}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("divide-border/60 flex flex-col divide-y rounded-xl border border-border/60", className)}>
      {items.map((item) => (
        <PbiCompactRow
          key={item.id}
          item={item}
          showHours={showHours}
          className={itemClassName}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        />
      ))}
    </div>
  );
}
