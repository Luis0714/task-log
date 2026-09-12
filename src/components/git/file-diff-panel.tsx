"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { DiffChangeNav } from "@/components/git/diff-change-nav";
import { DiffStat } from "@/components/git/diff-stat";
import { FileDiffHunks } from "@/components/git/file-diff-hunks";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiffChangeHotkeys } from "@/hooks/git/use-diff-change-hotkeys";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import { diffChangeElementId } from "@/lib/git/diff-changes";
import { fileNameFromPath } from "@/lib/git/file-name";
import { cn } from "@/lib/utils";

export type FileDiffChangeNavigation = {
  activeIndex: number;
  globalIndex: number;
  globalTotal: number;
  onPrev: () => void;
  onNext: () => void;
};

export type FileDiffPanelProps = Readonly<{
  file: GitFileChange | null;
  loading?: boolean;
  error?: string | null;
  fileHeading?: ReactNode;
  fileExtra?: ReactNode;
  changeNavigation?: FileDiffChangeNavigation;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

function FileDiffStatus({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center px-3 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function scrollChangeIntoView(id: string, container: HTMLElement | null) {
  const element = document.getElementById(id);
  if (!element) return;

  if (!container) {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const offset =
    elementRect.top -
    containerRect.top -
    containerRect.height / 2 +
    elementRect.height / 2;
  container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
}

function noop() {}

export function FileDiffPanel({
  file,
  loading = false,
  error = null,
  fileHeading,
  fileExtra,
  changeNavigation,
  onAddComment,
  renderAfterLine,
}: FileDiffPanelProps) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeChangeId =
    file && changeNavigation && changeNavigation.activeIndex >= 0
      ? diffChangeElementId(file.path, changeNavigation.activeIndex)
      : null;

  useEffect(() => {
    if (activeChangeId) {
      const id = activeChangeId;
      requestAnimationFrame(() => {
        scrollChangeIntoView(id, scrollerRef.current);
      });
      return;
    }
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [activeChangeId, file?.path]);

  const onNext = changeNavigation?.onNext;
  const onPrev = changeNavigation?.onPrev;
  const globalTotal = changeNavigation?.globalTotal ?? 0;

  useDiffChangeHotkeys(
    Boolean(onNext && onPrev && globalTotal > 0),
    onPrev ?? noop,
    onNext ?? noop,
    rootRef,
  );

  const heading = (
    <header className="relative z-10 flex min-w-0 flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <div
        className={cn(
          "flex min-w-0 items-center",
          fileHeading ? "basis-full" : "flex-1",
        )}
      >
        {fileHeading ??
          (file ? (
            <h3 className="flex min-w-0 flex-1 items-center gap-2 font-mono text-xs sm:text-sm">
              <FileTypeIcon name={fileNameFromPath(file.path)} />
              <span className="truncate">{file.path}</span>
            </h3>
          ) : null)}
      </div>
      {changeNavigation && changeNavigation.globalTotal > 0 ? (
        <DiffChangeNav
          activeIndex={changeNavigation.globalIndex - 1}
          total={changeNavigation.globalTotal}
          onPrev={changeNavigation.onPrev}
          onNext={changeNavigation.onNext}
        />
      ) : null}
      {!loading && file ? (
        <DiffStat additions={file.additions} deletions={file.deletions} />
      ) : null}
    </header>
  );

  if (loading) {
    return (
      <section
        ref={rootRef}
        className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card"
      >
        {fileHeading || changeNavigation ? heading : null}
        <div className="flex min-h-40 flex-1 flex-col gap-2 px-3 py-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        ref={rootRef}
        className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card"
      >
        {fileHeading || changeNavigation ? heading : null}
        <FileDiffStatus>
          <span className="text-destructive">{error}</span>
        </FileDiffStatus>
      </section>
    );
  }

  if (!file) {
    return (
      <section
        ref={rootRef}
        className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card"
      >
        {fileHeading || changeNavigation ? heading : null}
        <FileDiffStatus>Selecciona un archivo para ver el diff.</FileDiffStatus>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card"
    >
      {heading}
      {fileExtra}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <FileDiffHunks
          file={file}
          activeChangeIndex={changeNavigation?.activeIndex ?? -1}
          onAddComment={onAddComment}
          renderAfterLine={renderAfterLine}
        />
      </div>
    </section>
  );
}
