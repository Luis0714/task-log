import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GitDiffLine } from "@/lib/git/changeset";
import { cn } from "@/lib/utils";

export type DiffLineProps = {
  line: GitDiffLine;
  onAddComment?: () => void;
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

export function DiffLine({ line, onAddComment }: DiffLineProps) {
  const canComment = Boolean(onAddComment && (line.oldNumber || line.newNumber));

  return (
    <div
      className={cn(
        "group/diff-line relative grid grid-cols-[2rem_2rem_minmax(0,1fr)] font-mono text-[11px] leading-5 sm:text-xs",
        LINE_CLASS[line.type],
      )}
    >
      {canComment ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-0.5 right-1 z-10 bg-background/90 opacity-0 group-hover/diff-line:opacity-100 focus-visible:opacity-100"
          aria-label="Comentar esta línea"
          onClick={onAddComment}
        >
          <MessageSquarePlus />
        </Button>
      ) : null}
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
