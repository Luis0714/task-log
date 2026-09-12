import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PullRequestRepoBadgeProps = {
  repository: string;
  className?: string;
};

export function PullRequestRepoBadge({
  repository,
  className,
}: PullRequestRepoBadgeProps) {
  return (
    <Badge variant="outline" className={cn("h-5 max-w-36 px-1.5 font-mono text-[10px]", className)}>
      <span className="truncate">{repository}</span>
    </Badge>
  );
}
