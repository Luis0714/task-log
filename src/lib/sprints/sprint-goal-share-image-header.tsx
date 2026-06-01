import { IsotipoBadgeOgSvg } from "@/lib/brand/isotipo-badge-og";
import { SprintGoalShareImageBrandWordmark } from "@/lib/sprints/sprint-goal-share-image-brand-wordmark";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import {
  SPRINT_GOAL_SHARE_IMAGE_LAYOUT,
  sprintGoalShareImageColors,
  truncateSprintGoalShareText,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export type SprintGoalShareImageHeaderProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalShareImageHeader({ payload }: SprintGoalShareImageHeaderProps) {
  const { horizontalPadding } = SPRINT_GOAL_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${horizontalPadding}px ${horizontalPadding}px 24px`,
        borderBottom: `1px solid ${sprintGoalShareImageColors.border}`,
        backgroundColor: sprintGoalShareImageColors.card,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <IsotipoBadgeOgSvg size={56} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SprintGoalShareImageBrandWordmark />
          <span style={{ fontSize: 18, color: sprintGoalShareImageColors.muted, lineHeight: 1.3 }}>
            {SPRINT_GOAL_SHARE_LABELS.sprintObjective}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          maxWidth: 420,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, textAlign: "right" }}>
          {truncateSprintGoalShareText(payload.sprintName, 48)}
        </span>
        <span style={{ fontSize: 16, color: sprintGoalShareImageColors.muted, textAlign: "right" }}>
          {payload.projectName}
        </span>
        {payload.sprintDateRange ? (
          <span style={{ fontSize: 14, color: sprintGoalShareImageColors.muted, textAlign: "right" }}>
            {payload.sprintDateRange}
          </span>
        ) : null}
      </div>
    </div>
  );
}
