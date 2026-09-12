"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ChangedFileTree } from "@/components/git/changed-file-tree";
import { ChangesetMobileFilePicker } from "@/components/git/changeset-mobile-file-picker";
import { ChangesetSummary } from "@/components/git/changeset-summary";
import { FileDiffPanel } from "@/components/git/file-diff-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useFileDiff } from "@/hooks/git/use-file-diff";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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

  const diffPanel = (
    <FileDiffPanel
      file={diff.file ?? selected}
      loading={diff.loading}
      error={diff.error}
      fileHeading={
        isMobile ? (
          <ChangesetMobileFilePicker
            nodes={tree}
            selected={selected}
            fileCount={files.length}
            onSelect={setSelectedPath}
          />
        ) : null
      }
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
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ChangesetSummary
        fileCount={files.length}
        additions={stats.additions}
        deletions={stats.deletions}
      />
      {isMobile ? (
        <div className="flex h-[75dvh] min-h-80 flex-col overflow-hidden rounded-lg border bg-card">
          {diffPanel}
        </div>
      ) : (
        <div className="h-[min(70vh,42rem)] min-h-80 overflow-hidden rounded-lg border bg-card">
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel
              id="changeset-files"
              defaultSize="24%"
              minSize="16%"
              maxSize="42%"
              className="h-full min-h-0"
              style={{ overflow: "hidden" }}
            >
              <aside className="h-full min-h-0 overflow-y-auto overscroll-contain p-2">
                <ChangedFileTree
                  nodes={tree}
                  selectedPath={selected?.path ?? null}
                  onSelect={setSelectedPath}
                />
              </aside>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="changeset-diff"
              defaultSize="76%"
              minSize="40%"
              className="h-full min-h-0"
              style={{ overflow: "hidden" }}
            >
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                {diffPanel}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
