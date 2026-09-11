import { GitBranch, Star } from "lucide-react";

import type { GitBranchOption } from "@/lib/git/branch-option";
import { cn } from "@/lib/utils";

export type GitBranchOptionLabelProps = {
  option: GitBranchOption;
  className?: string;
};

export function GitBranchOptionLabel({ option, className }: GitBranchOptionLabelProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <GitBranch className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate font-mono">{option.name}</span>
      {option.isDefault ? (
        <Star className="size-3 shrink-0 fill-amber-500 text-amber-500" aria-label="Predeterminada" />
      ) : null}
    </span>
  );
}
