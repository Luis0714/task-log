import { SprintItemRow, type SprintItemRowSelection } from "@/components/sprint-items/sprint-item-row";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintItemListSelection = {
  /** IDs actualmente seleccionados. */
  selectedIds: ReadonlySet<number>;
  /** Alterna la selección de un item. */
  onToggle: (id: number, next: boolean) => void;
  /** Alterna la selección de todos los items visibles. */
  onToggleAll: (next: boolean) => void;
};

export type SprintItemListProps = {
  items: AdoWorkItemOptionDto[];
  loading?: boolean;
  emptyMessage?: string;
  showHours?: boolean;
  className?: string;
  onItemClick?: (item: AdoWorkItemOptionDto) => void;
  selection?: SprintItemListSelection;
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

function SelectAllHeader({
  items,
  selection,
}: {
  items: AdoWorkItemOptionDto[];
  selection: SprintItemListSelection;
}) {
  const total = items.length;
  const selectedCount = items.filter((item) => selection.selectedIds.has(item.id)).length;
  const allSelected = total > 0 && selectedCount === total;
  const someSelected = selectedCount > 0 && selectedCount < total;

  return (
    <div
      className="text-muted-foreground flex items-center gap-3 border-b border-border/60 px-3 py-2 text-xs"
    >
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onCheckedChange={(next) => selection.onToggleAll(next)}
        aria-label="Seleccionar todas las tareas visibles"
      />
      <span>
        {selectedCount === 0
          ? `Seleccionar todas (${total})`
          : `${selectedCount} de ${total} seleccionadas`}
      </span>
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
  selection,
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
      {selection ? <SelectAllHeader items={items} selection={selection} /> : null}
      {items.map((item) => {
        const rowSelection: SprintItemRowSelection | undefined = selection
          ? {
              selected: selection.selectedIds.has(item.id),
              onToggle: (next) => selection.onToggle(item.id, next),
            }
          : undefined;
        return (
          <SprintItemRow
            key={item.id}
            item={item}
            showHours={showHours}
            selection={rowSelection}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        );
      })}
    </div>
  );
}
