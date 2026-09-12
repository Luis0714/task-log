import { ReleaseCard } from "@/components/releases/release-card";
import type { ReleaseListItem, ReleaseStage } from "@/lib/releases/types";

export type ReleaseListProps = {
  items: readonly ReleaseListItem[];
  disabled?: boolean;
  onApprove?: (item: ReleaseListItem, stage: ReleaseStage) => void;
};

export function ReleaseList({ items, disabled, onApprove }: ReleaseListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <ReleaseCard item={item} disabled={disabled} onApprove={onApprove} />
        </li>
      ))}
    </ul>
  );
}
