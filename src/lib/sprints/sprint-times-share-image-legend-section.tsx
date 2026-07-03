import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import {
  SprintTimesShareBugIconSvg,
  SprintTimesShareClockIconSvg,
  SprintTimesShareDevIconSvg,
} from "@/lib/sprints/sprint-times-share-icon-svgs";
import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import {
  SPRINT_TIMES_SHARE_IMAGE_LAYOUT,
  sprintTimesShareImageTheme,
} from "@/lib/sprints/sprint-times-share-image-theme";

function LegendItem({
  icon,
  label,
  color,
}: {
  icon: "dev" | "bug" | "clock";
  label: string;
  color: string;
}) {
  const Icon =
    icon === "dev"
      ? SprintTimesShareDevIconSvg
      : icon === "bug"
        ? SprintTimesShareBugIconSvg
        : SprintTimesShareClockIconSvg;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: 13, color: sprintTimesShareImageTheme.muted }}>{label}</span>
    </div>
  );
}

export function SprintTimesShareImageLegendSection() {
  const { horizontalPadding } = SPRINT_TIMES_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: `12px ${horizontalPadding}px`,
        borderBottom: `1px solid ${sprintTimesShareImageTheme.border}`,
        backgroundColor: sprintTimesShareImageTheme.card,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <LegendItem
        icon="dev"
        label={SPRINT_TIMES_SHARE_LABELS.legendDevelopment}
        color={sprintTimesShareImageColors.development}
      />
      <LegendItem
        icon="bug"
        label={SPRINT_TIMES_SHARE_LABELS.legendBugs}
        color={sprintTimesShareImageColors.bug}
      />
      <LegendItem
        icon="clock"
        label={SPRINT_TIMES_SHARE_LABELS.legendSprintTotal}
        color={sprintTimesShareImageColors.sprintTotal}
      />
    </div>
  );
}
