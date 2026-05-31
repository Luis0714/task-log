"use client";

export type SprintGoalToolbarProps = {
  storyCount: number;
  totalStoryCount: number;
  includedStoryCount: number;
  excludedStoryCount: number;
  goalsCount: number;
  storySearch: string;
};

export function SprintGoalToolbar({
  storyCount,
  totalStoryCount,
  includedStoryCount,
  excludedStoryCount,
  goalsCount,
  storySearch,
}: SprintGoalToolbarProps) {
  const isFiltering = storySearch.trim().length > 0;
  const storyCountLabel =
    isFiltering && storyCount !== totalStoryCount
      ? `${storyCount} de ${totalStoryCount} historias`
      : `${storyCount} historia${storyCount === 1 ? "" : "s"}`;

  return (
    <p className="text-muted-foreground text-sm">
      {storyCountLabel} · {includedStoryCount} incluida
      {includedStoryCount === 1 ? "" : "s"}
      {excludedStoryCount > 0
        ? ` · ${excludedStoryCount} no incluida${excludedStoryCount === 1 ? "" : "s"}`
        : ""}
      {" · "}
      {goalsCount} con objetivo
    </p>
  );
}
