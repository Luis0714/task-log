import { SprintItemRow } from "@/components/sprint-items/sprint-item-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintItemListProps = {
  items: AdoWorkItemOptionDto[];
  loading?: boolean;
  emptyMessage?: string;
  showHours?: boolean;
  className?: string;
  onItemClick?: (item: AdoWorkItemOptionDto) => void;
};

function SprintItemListSkeleton() {
  return (
    <div className="divide-border/60 flex flex-col divide-y rounded-xl border border-border/60">
      <Skeleton className="mx-3 my-2.5 h-14 w-[calc(100%-1.5rem)]" />
      <Skeleton className="mx-3 my-2.5 h-14 w-[calc(100%-1.5rem)]" />
      <Skeleton className="mx-3 my-2.5 h-14 w-4/5" />
    </div>
  );
}

export function SprintItemList({
  items,
  loading = false,
  emptyMessage = "No hay elementos que coincidan con los filtros.",
  showHours = true,
  className,
  onItemClick,
}: SprintItemListProps) {
  if (loading) {
    return <SprintItemListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "divide-border/60 flex flex-col divide-y rounded-xl border border-border/60",
        className,
      )}
    >
      {items.map((item) => (
        <SprintItemRow
          key={item.id}
          item={item}
          showHours={showHours}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        />
      ))}
    </div>
  );
}
