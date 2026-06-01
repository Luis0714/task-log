import {
  buildSprintGoalShareMetrics,
  getSprintGoalShareObjectiveText,
} from "@/lib/sprints/sprint-goal-share-content";
import { truncateSprintGoalShareText } from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { sprintGoalSharePdfStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Text, View } from "@react-pdf/renderer";

const OBJECTIVE_MAX_LENGTH = 500;

export type SprintGoalSharePdfSummarySectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalSharePdfSummarySection({
  payload,
}: SprintGoalSharePdfSummarySectionProps) {
  const objectiveText = getSprintGoalShareObjectiveText(payload.generalObjective);
  const metrics = buildSprintGoalShareMetrics(payload.summary);

  return (
    <>
      <View style={sprintGoalSharePdfStyles.objectiveSection}>
        <Text style={sprintGoalSharePdfStyles.sectionTitle}>
          {SPRINT_GOAL_SHARE_LABELS.generalObjective}
        </Text>
        <Text>{truncateSprintGoalShareText(objectiveText, OBJECTIVE_MAX_LENGTH)}</Text>
      </View>

      <View style={sprintGoalSharePdfStyles.metricsRow}>
        {metrics.map((metric) => (
          <View key={metric.label} style={sprintGoalSharePdfStyles.metricCard}>
            <Text style={sprintGoalSharePdfStyles.metricValue}>{metric.value}</Text>
            <Text style={sprintGoalSharePdfStyles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}
