"use client";

import { useEffect, type ReactNode } from "react";

import { ChangesetMobileFileCard } from "@/components/git/changeset-mobile-file-card";
import { ChangesetMobileFilePicker } from "@/components/git/changeset-mobile-file-picker";
import { DiffChangeNav } from "@/components/git/diff-change-nav";
import type { FileDiffChangeNavigation } from "@/components/git/file-diff-panel";
import { useDiffChangeHotkeys } from "@/hooks/git/use-diff-change-hotkeys";
import type { GitDiffLine, GitFileChange } from "@/lib/git/changeset";
import {
  changesetFileElementId,
  diffChangeElementId,
} from "@/lib/git/diff-changes";
import type { FileTreeNode } from "@/lib/git/file-tree";

export type ChangesetMobileFileStackProps = Readonly<{
  files: readonly GitFileChange[];
  tree: readonly FileTreeNode[];
  selected: GitFileChange | null;
  selectedPath: string | null;
  changeNavigation: FileDiffChangeNavigation;
  isLoading: (path: string) => boolean;
  errorFor: (path: string) => string | null;
  onSelectFile: (path: string) => void;
  onVisibleFile: (path: string) => void;
  fileExtra?: (filePath: string) => ReactNode;
  onAddComment?: (filePath: string, line: GitDiffLine) => void;
  renderAfterLine?: (filePath: string, line: GitDiffLine) => ReactNode;
}>;

export function ChangesetMobileFileStack({
  files,
  tree,
  selected,
  selectedPath,
  changeNavigation,
  isLoading,
  errorFor,
  onSelectFile,
  onVisibleFile,
  fileExtra,
  onAddComment,
  renderAfterLine,
}: ChangesetMobileFileStackProps) {
  useDiffChangeHotkeys(
    changeNavigation.globalTotal > 0,
    changeNavigation.onPrev,
    changeNavigation.onNext,
  );

  useEffect(() => {
    if (!selectedPath) return;
    const targetId =
      changeNavigation.activeIndex >= 0
        ? diffChangeElementId(selectedPath, changeNavigation.activeIndex)
        : changesetFileElementId(selectedPath);

    const frame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [changeNavigation.activeIndex, selectedPath]);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="sticky top-14 z-10 -mx-4 flex items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur-md">
        <ChangesetMobileFilePicker
          nodes={tree}
          selected={selected}
          fileCount={files.length}
          onSelect={onSelectFile}
        />
        {changeNavigation.globalTotal > 0 ? (
          <DiffChangeNav
            activeIndex={changeNavigation.globalIndex - 1}
            total={changeNavigation.globalTotal}
            onPrev={changeNavigation.onPrev}
            onNext={changeNavigation.onNext}
          />
        ) : null}
      </div>
      {files.map((file) => (
        <ChangesetMobileFileCard
          key={file.path}
          file={file}
          loading={isLoading(file.path)}
          error={errorFor(file.path)}
          activeChangeIndex={
            selectedPath === file.path ? changeNavigation.activeIndex : -1
          }
          fileExtra={fileExtra?.(file.path)}
          onVisible={() => onVisibleFile(file.path)}
          onAddComment={
            onAddComment ? (line) => onAddComment(file.path, line) : undefined
          }
          renderAfterLine={
            renderAfterLine ? (line) => renderAfterLine(file.path, line) : undefined
          }
        />
      ))}
    </div>
  );
}
