import { cn } from "@/lib/utils";

export type PullRequestIdProps = {
  id: number;
  className?: string;
};

export function PullRequestId({ id, className }: PullRequestIdProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground shrink-0 font-mono text-xs tabular-nums",
        className,
      )}
    >
      #{id}
    </span>
  );
}
