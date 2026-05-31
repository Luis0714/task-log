import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WorkItemTagsReadonlyProps = {
  tags?: readonly string[];
  className?: string;
  emptyLabel?: string;
  compact?: boolean;
};

export function WorkItemTagsReadonly({
  tags,
  className,
  emptyLabel = "Sin tags",
  compact = false,
}: WorkItemTagsReadonlyProps) {
  const safeTags = (tags ?? []).filter((tag) => tag.trim());

  if (safeTags.length === 0) {
    return (
      <span className={cn("text-muted-foreground shrink-0 text-xs", className)}>{emptyLabel}</span>
    );
  }

  return (
    <div
      className={cn(
        compact ? "flex min-w-0 items-center gap-1 overflow-hidden" : "flex flex-wrap gap-1",
        className,
      )}
    >
      {safeTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            "max-w-full truncate text-xs font-normal",
            compact && "shrink min-w-0",
          )}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
