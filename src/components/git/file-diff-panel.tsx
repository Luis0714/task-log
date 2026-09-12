"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { DiffChangeNav } from "@/components/git/diff-change-nav";
import { DiffHunk } from "@/components/git/diff-hunk";
import { DiffStat } from "@/components/git/diff-stat";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiffChangeNavigation } from "@/hooks/git/use-diff-change-navigation";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import { fileNameFromPath } from "@/lib/git/file-name";
import { cn } from "@/lib/utils";

export type FileDiffPanelProps = Readonly<{
  file: GitFileChange | null;
  loading?: boolean;
  error?: string | null;
  fileHeading?: ReactNode;
  fileExtra?: ReactNode;
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

export function FileDiffPanel({
  file,
  loading = false,
  error = null,
  fileHeading,
  fileExtra,
  onAddComment,
  renderAfterLine,
}: FileDiffPanelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navigation = useDiffChangeNavigation({
    hunks: file?.hunks ?? [],
    resetKey: file?.path ?? "",
    containerRef: scrollerRef,
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [file?.path]);

  const heading = (
    <header className="flex min-w-0 flex-wrap items-center gap-2 border-b px-3 py-2">
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
      {!loading && file && navigation.changes.length > 0 ? (
        <DiffChangeNav
          activeIndex={navigation.activeIndex}
          total={navigation.changes.length}
          onPrev={navigation.goPrev}
          onNext={navigation.goNext}
        />
      ) : null}
      {!loading && file ? (
        <DiffStat additions={file.additions} deletions={file.deletions} />
      ) : null}
    </header>
  );

  if (loading) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
        {fileHeading ? heading : null}
        <div className="flex min-h-40 flex-1 flex-col gap-2 px-3 py-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
        {fileHeading ? heading : null}
        <FileDiffStatus>
          <span className="text-destructive">{error}</span>
        </FileDiffStatus>
      </section>
    );
  }

  if (!file) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
        {fileHeading ? heading : null}
        <FileDiffStatus>Selecciona un archivo para ver el diff.</FileDiffStatus>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
      {heading}
      {fileExtra}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-auto overscroll-contain">
        {file.hunks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin diferencias de contenido.
          </p>
        ) : (
          file.hunks.map((hunk, hunkIndex) => (
            <DiffHunk
              key={`${hunk.header}-${hunkIndex}`}
              hunk={hunk}
              hunkIndex={hunkIndex}
              changes={navigation.changes}
              activeChangeId={navigation.activeId}
              onAddComment={onAddComment}
              renderAfterLine={renderAfterLine}
            />
          ))
        )}
      </div>
    </section>
  );
}
