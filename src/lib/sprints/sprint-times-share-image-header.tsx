import { IsotipoBadgeOgSvg } from "@/lib/brand/isotipo-badge-og";
import { SprintGoalShareImageBrandWordmark } from "@/lib/sprints/sprint-goal-share-image-brand-wordmark";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import {
  SPRINT_TIMES_SHARE_IMAGE_LAYOUT,
  sprintTimesShareImageTheme,
  truncateSprintTimesShareText,
} from "@/lib/sprints/sprint-times-share-image-theme";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";

export function SprintTimesShareImageHeader({ payload }: { payload: SprintTimesSharePayload }) {
  const { horizontalPadding } = SPRINT_TIMES_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${horizontalPadding}px ${horizontalPadding}px 24px`,
        borderBottom: `1px solid ${sprintTimesShareImageTheme.border}`,
        backgroundColor: sprintTimesShareImageTheme.card,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <IsotipoBadgeOgSvg size={56} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SprintGoalShareImageBrandWordmark />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: sprintTimesShareImageTheme.muted, lineHeight: 1.3 }}>
              {SPRINT_TIMES_SHARE_LABELS.sectionTitle}
            </span>
            <span style={{ fontSize: 18, color: sprintTimesShareImageTheme.muted, lineHeight: 1.3 }}>
              ·
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: sprintTimesShareImageTheme.brand,
                lineHeight: 1.3,
              }}
            >
              {payload.variantLabel}
            </span>
          </div>
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
        <span style={{ fontSize: 20, fontWeight: 700, textAlign: "right", color: sprintTimesShareImageTheme.text }}>
          {truncateSprintTimesShareText(payload.sprintName, 48)}
        </span>
        <span style={{ fontSize: 16, color: sprintTimesShareImageTheme.muted, textAlign: "right" }}>
          {payload.projectName}
        </span>
        {payload.sprintDateRange ? (
          <span style={{ fontSize: 14, color: sprintTimesShareImageTheme.muted, textAlign: "right" }}>
            {payload.sprintDateRange}
          </span>
        ) : null}
      </div>
    </div>
  );
}
