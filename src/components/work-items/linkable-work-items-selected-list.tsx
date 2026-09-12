import { LinkableWorkItemSelectedRow } from "@/components/work-items/linkable-work-item-selected-row";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export type LinkableWorkItemsSelectedListProps = {
  items: readonly LinkableWorkItemDto[];
  onRemove: (id: number) => void;
};

export function LinkableWorkItemsSelectedList({
  items,
  onRemove,
}: LinkableWorkItemsSelectedListProps) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-border divide-y">
      {items.map((item) => (
        <LinkableWorkItemSelectedRow key={item.id} item={item} onRemove={onRemove} />
      ))}
    </ul>
  );
}
