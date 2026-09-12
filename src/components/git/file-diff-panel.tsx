import type { ReactNode } from "react";

import { DiffHunk } from "@/components/git/diff-hunk";
import { DiffStat } from "@/components/git/diff-stat";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import { fileNameFromPath } from "@/lib/git/file-name";

export type FileDiffPanelProps = Readonly<{
  file: GitFileChange | null;
  loading?: boolean;
  error?: string | null;
  fileExtra?: ReactNode;
  onAddComment?: (line: GitDiffLine) => void;
  renderAfterLine?: (line: GitDiffLine) => ReactNode;
}>;

export function FileDiffPanel({
  file,
  loading = false,
  error = null,
  fileExtra,
  onAddComment,
  renderAfterLine,
}: FileDiffPanelProps) {
  if (loading) {
    return (
      <div className="flex min-h-40 flex-col gap-2 rounded-lg border px-3 py-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground">
        Selecciona un archivo para ver el diff.
      </div>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <header className="flex min-w-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="flex min-w-0 items-center gap-2 font-mono text-xs sm:text-sm">
          <FileTypeIcon name={fileNameFromPath(file.path)} />
          <span className="truncate">{file.path}</span>
        </h3>
        <DiffStat additions={file.additions} deletions={file.deletions} />
      </header>
      {fileExtra}
      <div className="max-h-[28rem] overflow-auto">
        {file.hunks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin diferencias de contenido.
          </p>
        ) : (
          file.hunks.map((hunk) => (
            <DiffHunk
              key={hunk.header}
              hunk={hunk}
              onAddComment={onAddComment}
              renderAfterLine={renderAfterLine}
            />
          ))
        )}
      </div>
    </section>
  );
}
