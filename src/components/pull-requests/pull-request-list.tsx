import { PullRequestCard } from "@/components/pull-requests/pull-request-card";
import type { PullRequestListItem } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

export type PullRequestListProps = {
  items: readonly PullRequestListItem[];
  density?: "compact" | "comfortable";
  onSelect?: (id: number) => void;
  className?: string;
};

export function PullRequestList({
  items,
  density = "compact",
  onSelect,
  className,
}: PullRequestListProps) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <PullRequestCard item={item} density={density} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
