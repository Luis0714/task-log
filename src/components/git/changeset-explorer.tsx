"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ChangedFileTree } from "@/components/git/changed-file-tree";
import { ChangesetMobileFileStack } from "@/components/git/changeset-mobile-file-stack";
import { ChangesetSummary } from "@/components/git/changeset-summary";
import { FileDiffPanel } from "@/components/git/file-diff-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useChangesetChangeNavigation } from "@/hooks/git/use-changeset-change-navigation";
import { useFileDiffCache } from "@/hooks/git/use-file-diff-cache";
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
  const filesKey = files.map((file) => file.path).join("|");
  const [selectedPath, setSelectedPath] = useState<string | null>(
    () => files[0]?.path ?? null,
  );
  const cache = useFileDiffCache(query, filesKey);

  const loadFile = cache.load;
  const prefetchAll = cache.prefetchAll;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- filesKey is the path-list identity
  const filePaths = useMemo(() => files.map((file) => file.path), [filesKey]);

  useEffect(() => {
    setSelectedPath(files[0]?.path ?? null);
  }, [files]);

  useEffect(() => {
    prefetchAll(filePaths, filePaths[0] ?? null);
  }, [filePaths, prefetchAll]);

  useEffect(() => {
    if (selectedPath) loadFile(selectedPath);
  }, [loadFile, selectedPath]);

  const displayFiles = useMemo(
    () => files.map((file) => cache.filesByPath[file.path] ?? file),
    [cache.filesByPath, files],
  );
  const tree = useMemo(() => buildFileTree(displayFiles), [displayFiles]);
  const stats = useMemo(() => sumDiffStats(displayFiles), [displayFiles]);
  const selected = displayFiles.find((file) => file.path === selectedPath) ?? null;
  const loadedPaths = useMemo(
    () => new Set(Object.keys(cache.filesByPath)),
    [cache.filesByPath],
  );
  const selectPath = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);
  const changeNavigation = useChangesetChangeNavigation({
    files: displayFiles,
    loadedPaths,
    selectedPath,
    loading: selectedPath ? cache.isLoading(selectedPath) : false,
    onSelectFile: selectPath,
  });

  const fileDiffNav = {
    activeIndex: changeNavigation.activeIndex,
    globalIndex: changeNavigation.globalIndex,
    globalTotal: changeNavigation.globalTotal,
    onPrev: changeNavigation.goPrev,
    onNext: changeNavigation.goNext,
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ChangesetSummary
        fileCount={files.length}
        additions={stats.additions}
        deletions={stats.deletions}
      />
      {isMobile ? (
        <ChangesetMobileFileStack
          files={displayFiles}
          tree={tree}
          selected={selected}
          selectedPath={selectedPath}
          changeNavigation={fileDiffNav}
          isLoading={cache.isLoading}
          errorFor={(path) => cache.errorsByPath[path] ?? null}
          onSelectFile={changeNavigation.selectFile}
          onVisibleFile={cache.load}
          fileExtra={fileExtra}
          onAddComment={onAddComment}
          renderAfterLine={renderAfterLine}
        />
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
                  onSelect={changeNavigation.selectFile}
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
                <FileDiffPanel
                  file={
                    selectedPath
                      ? (cache.filesByPath[selectedPath] ?? selected)
                      : selected
                  }
                  loading={selectedPath ? cache.isLoading(selectedPath) : false}
                  error={selectedPath ? (cache.errorsByPath[selectedPath] ?? null) : null}
                  changeNavigation={fileDiffNav}
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
