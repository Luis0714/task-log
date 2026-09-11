import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

export type GitBranchIntoProps = {
  source: string;
  target: string;
  className?: string;
};

export function GitBranchInto({ source, target, className }: GitBranchIntoProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-sm",
        className,
      )}
      title={`${source} hacia ${target}`}
    >
      <span className="text-foreground inline-flex min-w-0 items-center gap-1.5 font-mono">
        <GitBranch className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{source}</span>
      </span>
      <span>hacia</span>
      <span className="text-foreground inline-flex min-w-0 items-center gap-1.5 font-mono">
        <GitBranch className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{target}</span>
      </span>
    </p>
  );
}
