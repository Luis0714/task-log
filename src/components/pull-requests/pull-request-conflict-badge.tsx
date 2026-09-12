import { StatusDotBadge } from "@/components/shared/status-dot-badge";
import { cn } from "@/lib/utils";

export type PullRequestConflictBadgeProps = {
  className?: string;
};

export function PullRequestConflictBadge({ className }: PullRequestConflictBadgeProps) {
  return (
    <StatusDotBadge
      label="Conflictos"
      className={cn(
        "border-destructive/40 bg-destructive/10 text-destructive",
        className,
      )}
      dotClassName="bg-destructive"
    />
  );
}
