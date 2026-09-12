"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type RefObject,
} from "react";

import type { GitDiffHunk } from "@/lib/git/changeset";
import {
  collectDiffChanges,
  type DiffChangeAnchor,
} from "@/lib/git/diff-changes";

export type UseDiffChangeNavigationInput = {
  hunks: readonly GitDiffHunk[];
  resetKey: string;
  containerRef: RefObject<HTMLElement | null>;
};

export type UseDiffChangeNavigationResult = {
  changes: DiffChangeAnchor[];
  activeId: string | null;
  activeIndex: number;
  goNext: () => void;
  goPrev: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}

function scrollChangeIntoView(
  id: string,
  container: HTMLElement | null,
) {
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

export function useDiffChangeNavigation({
  hunks,
  resetKey,
  containerRef,
}: UseDiffChangeNavigationInput): UseDiffChangeNavigationResult {
  const ownerId = useId();
  const changes = useMemo(
    () =>
      collectDiffChanges(hunks).map((change, index) => ({
        ...change,
        id: `${ownerId}-change-${index}`,
      })),
    [hunks, ownerId],
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(null);
  }, [resetKey]);

  const activeIndex = changes.findIndex((change) => change.id === activeId);

  const goTo = useCallback(
    (index: number) => {
      const change = changes[index];
      if (!change) return;
      setActiveId(change.id);
      requestAnimationFrame(() => {
        scrollChangeIntoView(change.id, containerRef.current);
      });
    },
    [changes, containerRef],
  );

  const goNext = useCallback(() => {
    if (changes.length === 0) return;
    const nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % changes.length;
    goTo(nextIndex);
  }, [activeIndex, changes.length, goTo]);

  const goPrev = useCallback(() => {
    if (changes.length === 0) return;
    const prevIndex =
      activeIndex < 0
        ? changes.length - 1
        : (activeIndex - 1 + changes.length) % changes.length;
    goTo(prevIndex);
  }, [activeIndex, changes.length, goTo]);

  useEffect(() => {
    if (changes.length === 0) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      if (containerRef.current?.getClientRects().length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changes.length, containerRef, goNext, goPrev]);

  return { changes, activeId, activeIndex, goNext, goPrev };
}
