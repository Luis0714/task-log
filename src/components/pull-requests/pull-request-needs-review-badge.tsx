import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PullRequestNeedsReviewBadgeProps = {
  className?: string;
};

export function PullRequestNeedsReviewBadge({
  className,
}: PullRequestNeedsReviewBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] text-amber-800 dark:text-amber-300",
        className,
      )}
    >
      Te toca revisar
    </Badge>
  );
}
