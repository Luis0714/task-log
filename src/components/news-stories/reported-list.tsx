import { Skeleton } from "@/components/ui/skeleton";
import type { ReportedNewsDetail } from "@/lib/azure-devops/list-reported-news";
import { ReportedRow } from "@/components/news-stories/reported-row";

export type ReportedListProps = Readonly<{
  items: ReadonlyArray<ReportedNewsDetail>;
}>;

/** Lista con borde; cada fila es `<ReportedRow>`. */
export function ReportedList({ items }: ReportedListProps) {
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <ul className="flex flex-col">
        {items.map((item) => (
          <ReportedRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function ReportedSkeleton() {
  const placeholders = ["first", "second", "third"];
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <ul className="flex flex-col">
        {placeholders.map((slot) => (
          <li
            key={`reported-skeleton-${slot}`}
            className="border-border/40 flex flex-col gap-2 border-t px-4 py-3 first:border-t-0"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4 max-w-lg" />
            <Skeleton className="h-3 w-40" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export type ReportedEmptyStateProps = Readonly<{
  title: string;
  description: string;
}>;

export function ReportedEmptyState({
  title,
  description,
}: ReportedEmptyStateProps) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
