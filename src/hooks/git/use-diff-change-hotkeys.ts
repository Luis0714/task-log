"use client";

import { useEffect, type RefObject } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}

export function useDiffChangeHotkeys(
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
  visibleRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      if (visibleRef?.current && visibleRef.current.getClientRects().length === 0) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onNext, onPrev, visibleRef]);
}
