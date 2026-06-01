import { formatSprintGoalShareDateTime } from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import {
  SPRINT_GOAL_SHARE_IMAGE_LAYOUT,
  sprintGoalShareImageColors,
  truncateSprintGoalShareText,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export type SprintGoalShareImageFooterSectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalShareImageFooterSection({
  payload,
}: SprintGoalShareImageFooterSectionProps) {
  const generatedDateTime = formatSprintGoalShareDateTime(payload.generatedAt);
  const { horizontalPadding } = SPRINT_GOAL_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: `20px ${horizontalPadding}px ${horizontalPadding}px`,
        borderTop: `1px solid ${sprintGoalShareImageColors.border}`,
        backgroundColor: sprintGoalShareImageColors.card,
        fontSize: 14,
        color: sprintGoalShareImageColors.muted,
      }}
    >
      <span style={{ fontWeight: 700, color: sprintGoalShareImageColors.text }}>
        {payload.platformName}
      </span>
      <span>
        {SPRINT_GOAL_SHARE_LABELS.generatedOn} {generatedDateTime}
      </span>
      <span>{truncateSprintGoalShareText(payload.scopeLabel, 120)}</span>
    </div>
  );
}
