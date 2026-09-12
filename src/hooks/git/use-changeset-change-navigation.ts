"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { GitFileChange } from "@/lib/git/changeset";
import {
  collectDiffChanges,
  estimateGlobalChangePosition,
  resolveDiffChangeStep,
  type DiffChangeDirection,
} from "@/lib/git/diff-changes";

export type UseChangesetChangeNavigationInput = {
  files: readonly GitFileChange[];
  loadedPaths: ReadonlySet<string>;
  selectedPath: string | null;
  loading: boolean;
  onSelectFile: (path: string) => void;
};

export type UseChangesetChangeNavigationResult = {
  activeIndex: number;
  globalIndex: number;
  globalTotal: number;
  goNext: () => void;
  goPrev: () => void;
  selectFile: (path: string) => void;
};

export function useChangesetChangeNavigation({
  files,
  loadedPaths,
  selectedPath,
  loading,
  onSelectFile,
}: UseChangesetChangeNavigationInput): UseChangesetChangeNavigationResult {
  const [changeIndex, setChangeIndex] = useState(-1);
  const [landing, setLanding] = useState<"first" | "last" | null>(null);
  const filesKey = files.map((file) => file.path).join("|");

  useEffect(() => {
    setChangeIndex(-1);
    setLanding(null);
  }, [filesKey]);

  const selectedFile = files.find((file) => file.path === selectedPath) ?? null;
  const selectedCount = selectedFile
    ? collectDiffChanges(selectedFile.hunks).length
    : 0;

  useEffect(() => {
    if (!landing || loading || !selectedPath) return;
    if (!loadedPaths.has(selectedPath)) return;

    if (selectedCount === 0) {
      const step = resolveDiffChangeStep({
        files,
        loadedPaths,
        currentPath: selectedPath,
        currentChangeIndex: 0,
        direction: landing === "first" ? 1 : -1,
      });
      if (!step || step.filePath === selectedPath) {
        setLanding(null);
        setChangeIndex(-1);
        return;
      }
      setLanding(step.landing);
      setChangeIndex(step.landing ? -1 : step.changeIndex);
      onSelectFile(step.filePath);
      return;
    }

    setChangeIndex(landing === "first" ? 0 : selectedCount - 1);
    setLanding(null);
  }, [
    files,
    landing,
    loadedPaths,
    loading,
    onSelectFile,
    selectedCount,
    selectedPath,
  ]);

  const position = useMemo(
    () =>
      estimateGlobalChangePosition(
        files,
        loadedPaths,
        selectedPath,
        changeIndex,
      ),
    [changeIndex, files, loadedPaths, selectedPath],
  );

  const applyDirection = useCallback(
    (direction: DiffChangeDirection) => {
      const step = resolveDiffChangeStep({
        files,
        loadedPaths,
        currentPath: selectedPath,
        currentChangeIndex: changeIndex,
        direction,
      });
      if (!step) return;
      if (step.filePath !== selectedPath) {
        setLanding(step.landing);
        setChangeIndex(step.landing ? -1 : step.changeIndex);
        onSelectFile(step.filePath);
        return;
      }
      setLanding(null);
      setChangeIndex(step.changeIndex);
    },
    [changeIndex, files, loadedPaths, onSelectFile, selectedPath],
  );

  const goNext = useCallback(() => applyDirection(1), [applyDirection]);
  const goPrev = useCallback(() => applyDirection(-1), [applyDirection]);

  const selectFile = useCallback(
    (path: string) => {
      setLanding(null);
      setChangeIndex(-1);
      onSelectFile(path);
    },
    [onSelectFile],
  );

  return {
    activeIndex: changeIndex,
    globalIndex: position.current,
    globalTotal: position.total,
    goNext,
    goPrev,
    selectFile,
  };
}
