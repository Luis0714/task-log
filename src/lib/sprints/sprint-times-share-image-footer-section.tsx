import { formatSprintGoalShareDateTime } from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import {
  SPRINT_TIMES_SHARE_IMAGE_LAYOUT,
  sprintTimesShareImageTheme,
  truncateSprintTimesShareText,
} from "@/lib/sprints/sprint-times-share-image-theme";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";

export function SprintTimesShareImageFooterSection({ payload }: { payload: SprintTimesSharePayload }) {
  const generatedDateTime = formatSprintGoalShareDateTime(payload.generatedAt);
  const { horizontalPadding } = SPRINT_TIMES_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: `20px ${horizontalPadding}px ${horizontalPadding}px`,
        borderTop: `1px solid ${sprintTimesShareImageTheme.border}`,
        backgroundColor: sprintTimesShareImageTheme.card,
        fontSize: 14,
        color: sprintTimesShareImageTheme.muted,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <span style={{ fontWeight: 700, color: sprintTimesShareImageTheme.text }}>
        {payload.platformName}
      </span>
      <span>
        {SPRINT_TIMES_SHARE_LABELS.generatedOn} {generatedDateTime}
      </span>
      <span>{truncateSprintTimesShareText(payload.scopeLabel, 120)}</span>
      <span>{payload.dataSourceLabel}</span>
    </div>
  );
}
