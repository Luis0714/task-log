import {
  buildSprintGoalShareMetrics,
  getSprintGoalShareObjectiveText,
} from "@/lib/sprints/sprint-goal-share-content";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalShareImageSummaryMetric } from "@/lib/sprints/sprint-goal-share-image-summary-metric";
import {
  SPRINT_GOAL_SHARE_IMAGE_LAYOUT,
  sprintGoalShareImageColors,
  truncateSprintGoalShareText,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export type SprintGoalShareImageSummarySectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalShareImageSummarySection({
  payload,
}: SprintGoalShareImageSummarySectionProps) {
  const objectiveText = getSprintGoalShareObjectiveText(payload.generalObjective);
  const metrics = buildSprintGoalShareMetrics(payload.summary);
  const { horizontalPadding } = SPRINT_GOAL_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: `24px ${horizontalPadding}px`,
        backgroundColor: sprintGoalShareImageColors.card,
        borderBottom: `1px solid ${sprintGoalShareImageColors.border}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: sprintGoalShareImageColors.brand }}>
          {SPRINT_GOAL_SHARE_LABELS.generalObjective}
        </span>
        <span style={{ fontSize: 18, lineHeight: 1.5 }}>
          {truncateSprintGoalShareText(objectiveText, 280)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {metrics.map((metric) => (
          <SprintGoalShareImageSummaryMetric
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>
    </div>
  );
}
