import { ArrowRight, GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

export type GitBranchPairProps = {
  source: string;
  target: string;
  className?: string;
};

export function GitBranchPair({ source, target, className }: GitBranchPairProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground flex min-w-0 items-center gap-1.5 font-mono text-[11px]",
        className,
      )}
      title={`${source} → ${target}`}
    >
      <GitBranch className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{source}</span>
      <ArrowRight className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{target}</span>
    </p>
  );
}
