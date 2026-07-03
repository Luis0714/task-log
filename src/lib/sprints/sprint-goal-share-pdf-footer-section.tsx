import { formatSprintGoalShareDateTime, truncateSprintGoalShareText } from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { sprintGoalSharePdfStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Text, View } from "@react-pdf/renderer";

const SCOPE_LABEL_MAX_LENGTH = 160;

export type SprintGoalSharePdfFooterSectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalSharePdfFooterSection({ payload }: SprintGoalSharePdfFooterSectionProps) {
  return (
    <View style={sprintGoalSharePdfStyles.footer}>
      <Text style={sprintGoalSharePdfStyles.footerBrand}>{payload.platformName}</Text>
      <Text>
        {SPRINT_GOAL_SHARE_LABELS.generatedOn}{" "}
        {formatSprintGoalShareDateTime(payload.generatedAt)}
      </Text>
      <Text>{truncateSprintGoalShareText(payload.scopeLabel, SCOPE_LABEL_MAX_LENGTH)}</Text>
    </View>
  );
}
