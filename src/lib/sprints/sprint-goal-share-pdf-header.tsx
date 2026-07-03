import { SprintGoalSharePdfBrandWordmark } from "@/lib/sprints/sprint-goal-share-pdf-brand-wordmark";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalSharePdfLogo } from "@/lib/sprints/sprint-goal-share-pdf-logo";
import { sprintGoalSharePdfHeaderStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Text, View } from "@react-pdf/renderer";

export type SprintGoalSharePdfHeaderProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalSharePdfHeader({ payload }: SprintGoalSharePdfHeaderProps) {
  const styles = sprintGoalSharePdfHeaderStyles;

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <SprintGoalSharePdfLogo size={42} />
        <View style={styles.headerLeftText}>
          <SprintGoalSharePdfBrandWordmark />
          <Text style={styles.subtitle}>{SPRINT_GOAL_SHARE_LABELS.sprintObjective}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.sprintName}>{payload.sprintName}</Text>
        <Text style={styles.meta}>{payload.projectName}</Text>
        {payload.sprintDateRange ? (
          <Text style={styles.meta}>{payload.sprintDateRange}</Text>
        ) : null}
      </View>
    </View>
  );
}
