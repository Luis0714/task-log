"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { DiffStat } from "@/components/git/diff-stat";
import { FileDiffHunks } from "@/components/git/file-diff-hunks";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import { changesetFileElementId } from "@/lib/git/diff-changes";
import { fileNameFromPath } from "@/lib/git/file-name";

export type ChangesetMobileFileCardProps = Readonly<{
  file: GitFileChange;
  loading?: boolean;
  error?: string | null;
  activeChangeIndex?: number;
  fileExtra?: ReactNode;
  onVisible: () => void;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

export function ChangesetMobileFileCard({
  file,
  loading = false,
  error = null,
  activeChangeIndex = -1,
  fileExtra,
  onVisible,
  onAddComment,
  renderAfterLine,
}: ChangesetMobileFileCardProps) {
  const rootRef = useRef<HTMLElement>(null);
  const name = fileNameFromPath(file.path);
  const directory = file.path.includes("/")
    ? `/${file.path.slice(0, file.path.lastIndexOf("/"))}`
    : "";

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onVisible();
      },
      { rootMargin: "280px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <article
      ref={rootRef}
      id={changesetFileElementId(file.path)}
      className="scroll-mt-28 overflow-hidden rounded-lg border bg-card"
    >
      <Collapsible defaultOpen>
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="group/file-card flex w-full min-w-0 items-start gap-2 px-3 py-2.5 text-left"
            />
          }
        >
          <ChevronDown
            className="mt-0.5 size-4 shrink-0 -rotate-90 text-muted-foreground transition-transform group-aria-expanded/file-card:rotate-0"
            aria-hidden
          />
          <FileTypeIcon name={name} />
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-sm font-medium">{name}</span>
              <DiffStat additions={file.additions} deletions={file.deletions} />
            </span>
            {directory ? (
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                {directory}
              </span>
            ) : null}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {fileExtra}
          {loading ? (
            <div className="flex flex-col gap-2 px-3 py-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}
          {error ? (
            <p className="px-3 py-4 text-center text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error ? (
            <FileDiffHunks
              file={file}
              activeChangeIndex={activeChangeIndex}
              onAddComment={onAddComment}
              renderAfterLine={renderAfterLine}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
