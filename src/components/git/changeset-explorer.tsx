"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ChangedFileTree } from "@/components/git/changed-file-tree";
import { ChangesetSummary } from "@/components/git/changeset-summary";
import { FileDiffPanel } from "@/components/git/file-diff-panel";
import { useFileDiff } from "@/hooks/git/use-file-diff";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import { buildFileTree } from "@/lib/git/file-tree";
import { sumDiffStats } from "@/lib/git/sum-diff-stats";

export type ChangesetExplorerQuery = {
  project: string;
  repository: string;
  source: string;
  target: string;
};

export type ChangesetExplorerProps = Readonly<{
  files: readonly GitFileChange[];
  query: ChangesetExplorerQuery;
  fileExtra?: (filePath: string) => ReactNode;
  onAddComment?: (filePath: string, line: GitDiffLine) => void;
  renderAfterLine?: (filePath: string, line: GitDiffLine) => ReactNode;
}>;

export function ChangesetExplorer({
  files,
  query,
  fileExtra,
  onAddComment,
  renderAfterLine,
}: ChangesetExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    () => files[0]?.path ?? null,
  );
  const [resolvedByPath, setResolvedByPath] = useState<Record<string, GitFileChange>>({});
  const diff = useFileDiff({
    ...query,
    path: selectedPath,
  });

  useEffect(() => {
    setSelectedPath(files[0]?.path ?? null);
    setResolvedByPath({});
  }, [files]);

  useEffect(() => {
    const resolved = diff.file;
    if (!resolved) return;
    setResolvedByPath((current) => ({
      ...current,
      [resolved.path]: resolved,
    }));
  }, [diff.file]);

  const displayFiles = useMemo(
    () => files.map((file) => resolvedByPath[file.path] ?? file),
    [files, resolvedByPath],
  );
  const tree = useMemo(() => buildFileTree(displayFiles), [displayFiles]);
  const stats = useMemo(() => sumDiffStats(displayFiles), [displayFiles]);
  const selected = displayFiles.find((file) => file.path === selectedPath) ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ChangesetSummary
        fileCount={files.length}
        additions={stats.additions}
        deletions={stats.deletions}
      />
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
        <aside className="min-w-0 max-h-56 overflow-auto rounded-lg border bg-card p-2 md:max-h-[28rem] md:w-56 md:shrink-0">
          <ChangedFileTree
            nodes={tree}
            selectedPath={selected?.path ?? null}
            onSelect={setSelectedPath}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <FileDiffPanel
            file={diff.file ?? selected}
            loading={diff.loading}
            error={diff.error}
            fileExtra={selected ? fileExtra?.(selected.path) : null}
            onAddComment={
              selected && onAddComment
                ? (line) => onAddComment(selected.path, line)
                : undefined
            }
            renderAfterLine={
              selected && renderAfterLine
                ? (line) => renderAfterLine(selected.path, line)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
