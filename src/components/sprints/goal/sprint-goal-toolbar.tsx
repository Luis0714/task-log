"use client";

import type { ReactNode } from "react";

export type SprintGoalToolbarProps = {
  storyCount: number;
  totalStoryCount: number;
  excludedStoryCount: number;
  goalsCount: number;
  storySearch: string;
  actions?: ReactNode;
};

export function SprintGoalToolbar({
  storyCount,
  totalStoryCount,
  excludedStoryCount,
  goalsCount,
  storySearch,
  actions,
}: SprintGoalToolbarProps) {
  const isFiltering = storySearch.trim().length > 0;
  const storyCountLabel =
    isFiltering && storyCount !== totalStoryCount
      ? `${storyCount} de ${totalStoryCount} historias`
      : `${storyCount} historia${storyCount === 1 ? "" : "s"}`;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground min-w-0 text-sm">
        {storyCountLabel}
        {excludedStoryCount > 0
          ? ` · ${excludedStoryCount} no incluida${excludedStoryCount === 1 ? "" : "s"}`
          : ""}
        {" · "}
        {goalsCount} con objetivo
      </p>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
