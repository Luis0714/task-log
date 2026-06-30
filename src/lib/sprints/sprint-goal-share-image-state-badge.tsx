import { sprintGoalShareImageColors } from "@/lib/sprints/sprint-goal-share-image-theme";
import { getStateExportBadgeStyle } from "@/lib/work-items/pbi-state-colors";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";

export type SprintGoalShareImageStateBadgeProps = Readonly<{
  state: string;
  backlogStates: readonly AdoTaskStateDto[];
}>;

export function SprintGoalShareImageStateBadge({
  state,
  backlogStates,
}: Readonly<SprintGoalShareImageStateBadgeProps>) {
  if (!state || state === "—") {
    return (
      <span style={{ color: sprintGoalShareImageColors.muted, fontSize: 13 }}>{state}</span>
    );
  }

  const badgeStyle = getStateExportBadgeStyle(backlogStates, state);

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