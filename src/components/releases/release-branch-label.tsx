import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

export type ReleaseBranchLabelProps = {
  branch: string;
  author?: string;
  className?: string;
};

export function ReleaseBranchLabel({
  branch,
  author,
  className,
}: ReleaseBranchLabelProps) {
  const title = author ? `${branch} · ${author}` : branch;

  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex min-w-0 items-center gap-1 text-[11px]",
        className,
      )}
      title={title}
    >
      <GitBranch className="size-3 shrink-0" aria-hidden />
      <span className="truncate font-mono">{branch}</span>
      {author ? (
        <>
          <span aria-hidden>·</span>
          <span className="truncate">{author}</span>
        </>
      ) : null}
    </span>
  );
}
