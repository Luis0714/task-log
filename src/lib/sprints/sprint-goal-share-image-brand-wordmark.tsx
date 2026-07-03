import { SPRINT_GOAL_SHARE_BRAND_WORDMARK } from "@/lib/sprints/sprint-goal-share-brand-wordmark";
import { sprintGoalShareImageColors } from "@/lib/sprints/sprint-goal-share-image-theme";

export function SprintGoalShareImageBrandWordmark() {
  return (
    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25 }}>
      <span style={{ color: sprintGoalShareImageColors.brand }}>
        {SPRINT_GOAL_SHARE_BRAND_WORDMARK.neos}
      </span>
      <span style={{ color: sprintGoalShareImageColors.text }}>
        {SPRINT_GOAL_SHARE_BRAND_WORDMARK.view}
      </span>
    </span>
  );
}
