import type { GitDiffLine } from "@/lib/git/changeset";
import { cn } from "@/lib/utils";

export type DiffLineProps = {
  line: GitDiffLine;
};

const LINE_CLASS: Record<GitDiffLine["type"], string> = {
  context: "bg-transparent text-foreground",
  addition: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  deletion: "bg-rose-500/10 text-rose-800 dark:text-rose-300",
};

const PREFIX: Record<GitDiffLine["type"], string> = {
  context: " ",
  addition: "+",
  deletion: "−",
};

export function DiffLine({ line }: DiffLineProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_2rem_minmax(0,1fr)] font-mono text-[11px] leading-5 sm:text-xs",
        LINE_CLASS[line.type],
      )}
    >
      <span className="select-none px-1 text-right text-muted-foreground tabular-nums">
        {line.oldNumber ?? ""}
      </span>
      <span className="select-none px-1 text-right text-muted-foreground tabular-nums">
        {line.newNumber ?? ""}
      </span>
      <span className="min-w-0 overflow-x-auto whitespace-pre px-2">
        {PREFIX[line.type]}
        {line.content}
      </span>
    </div>
  );
}
