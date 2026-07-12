import { Skeleton } from "@/components/ui/skeleton";
import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { LinkedRow } from "@/components/news-stories/linked-row";

export type LinkedListProps = Readonly<{
  items: ReadonlyArray<ProjectTeamNewsStory>;
  validationById: ReadonlyMap<string, NewsStoryValidationEntry>;
  onUnlink: (item: ProjectTeamNewsStory) => void;
}>;

/** Lista con borde; cada fila es `<LinkedRow>`. */
export function LinkedList({
  items,
  validationById,
  onUnlink,
}: LinkedListProps) {
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <ul className="flex flex-col">
        {items.map((row) => (
          <LinkedRow
            key={row.id}
            row={row}
            validation={validationById.get(row.id)}
            onUnlink={onUnlink}
          />
        ))}
      </ul>
    </div>
  );
}

const SKELETON_SLOTS = ["first", "second", "third"] as const;

/** Placeholder mientras llegan las HUs vinculadas. */
export function LinkedSkeleton() {
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <ul className="flex flex-col">
        {SKELETON_SLOTS.map((slot) => (
          <li
            key={`linked-skeleton-${slot}`}
            className="border-border/40 flex items-center gap-3 border-t px-3 py-2.5 first:border-t-0"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-7" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export type LinkedEmptyStateProps = Readonly<{ description: string }>;

export function LinkedEmptyState({ description }: LinkedEmptyStateProps) {
  return (
    <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
      {description}
    </p>
  );
}
