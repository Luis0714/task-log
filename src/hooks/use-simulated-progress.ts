"use client";

import { useEffect, useState } from "react";

const MAX_PROGRESS_WHILE_ACTIVE = 90;
const TICK_MS = 200;

function nextProgressStep(current: number): number {
  if (current >= MAX_PROGRESS_WHILE_ACTIVE) return current;

  const increment = current < 50 ? 4 : current < 75 ? 2 : 1;
  return Math.min(current + increment, MAX_PROGRESS_WHILE_ACTIVE);
}

export function useSimulatedProgress(active: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    setProgress(0);

    const intervalId = window.setInterval(() => {
      setProgress(nextProgressStep);
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [active]);

  return progress;
}
