import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GitDiffLine } from "@/lib/git/changeset";
import type { InlineDiffSegment } from "@/lib/git/inline-diff";
import { cn } from "@/lib/utils";

export type DiffLineProps = Readonly<{
  line: GitDiffLine;
  inline?: InlineDiffSegment[] | null;
  isActiveChange?: boolean;
  onAddComment?: () => void;
}>;

const LINE_CLASS: Record<GitDiffLine["type"], string> = {
  context: "bg-transparent text-foreground",
  addition: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  deletion: "bg-rose-500/10 text-rose-800 dark:text-rose-300",
};

const INLINE_CLASS: Record<GitDiffLine["type"], string> = {
  context: "",
  addition: "rounded-[2px] bg-emerald-600/25 dark:bg-emerald-400/30",
  deletion: "rounded-[2px] bg-rose-600/25 dark:bg-rose-400/30",
};

const PREFIX: Record<GitDiffLine["type"], string> = {
  context: " ",
  addition: "+",
  deletion: "−",
};

export function DiffLine({
  line,
  inline = null,
  isActiveChange = false,
  onAddComment,
}: DiffLineProps) {
  const canComment = Boolean(onAddComment && (line.oldNumber || line.newNumber));

  return (
    <div
      className={cn(
        "group/diff-line relative grid grid-cols-[2rem_2rem_minmax(0,1fr)] font-mono text-[11px] leading-5 sm:text-xs",
        LINE_CLASS[line.type],
        isActiveChange && "bg-primary/10 ring-1 ring-inset ring-primary/40",
      )}
    >
      {canComment ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="pointer-events-none absolute top-0.5 left-0.5 z-1 bg-background/95 opacity-0 group-hover/diff-line:pointer-events-auto group-hover/diff-line:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
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
        {inline && inline.length > 0
          ? inline.map((segment, index) => (
              <span
                key={`${segment.text}-${index}`}
                className={segment.changed ? INLINE_CLASS[line.type] : undefined}
              >
                {segment.text}
              </span>
            ))
          : line.content}
      </span>
    </div>
  );
}
