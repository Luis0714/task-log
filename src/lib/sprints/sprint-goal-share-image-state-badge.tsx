import { sprintGoalShareImageColors } from "@/lib/sprints/sprint-goal-share-image-theme";
import {
  getPbiStateExportBadgeStyle,
  isPbiStateBadgeRenderable,
} from "@/lib/work-items/pbi-state-colors";

export type SprintGoalShareImageStateBadgeProps = {
  state: string;
};

export function SprintGoalShareImageStateBadge({ state }: SprintGoalShareImageStateBadgeProps) {
  if (!isPbiStateBadgeRenderable(state)) {
    return (
      <span style={{ color: sprintGoalShareImageColors.muted, fontSize: 13 }}>{state}</span>
    );
  }

  const badgeStyle = getPbiStateExportBadgeStyle(state);

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        maxWidth: "100%",
        overflow: "hidden",
        borderRadius: 9999,
        border: `1px solid ${badgeStyle.borderColor}`,
        backgroundColor: badgeStyle.backgroundColor,
        color: badgeStyle.color,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: badgeStyle.dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {state}
      </span>
    </span>
  );
}
