import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PullRequestMineBadgeProps = {
  className?: string;
};

export function PullRequestMineBadge({ className }: PullRequestMineBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px]", className)}>
      Tu PR
    </Badge>
  );
}
