import {
  formatSprintGoalShareOverflowMessage,
  formatSprintGoalShareStoryTitle,
} from "@/lib/sprints/sprint-goal-share-content";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalSharePdfStateBadge } from "@/lib/sprints/sprint-goal-share-pdf-state-badge";
import { sprintGoalSharePdfStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Text, View } from "@react-pdf/renderer";

const STORY_TITLE_MAX_LENGTH = 80;

export type SprintGoalSharePdfTableSectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalSharePdfTableSection({ payload }: SprintGoalSharePdfTableSectionProps) {
  return (
    <View>
      <View style={sprintGoalSharePdfStyles.tableHeader}>
        <Text style={sprintGoalSharePdfStyles.colStory}>
          {SPRINT_GOAL_SHARE_LABELS.userStoryColumn}
        </Text>
        <Text style={sprintGoalSharePdfStyles.colState}>
          {SPRINT_GOAL_SHARE_LABELS.stateColumn}
        </Text>
        <Text style={sprintGoalSharePdfStyles.colTag}>{SPRINT_GOAL_SHARE_LABELS.tagColumn}</Text>
      </View>

      {payload.visibleStories.map((story) => (
        <View key={story.workItemId} style={sprintGoalSharePdfStyles.tableRow} wrap={false}>
          <Text style={sprintGoalSharePdfStyles.colStory}>
            {formatSprintGoalShareStoryTitle(
              story.workItemId,
              story.title,
              STORY_TITLE_MAX_LENGTH,
            )}
          </Text>
          <View style={sprintGoalSharePdfStyles.colStateCell}>
            <SprintGoalSharePdfStateBadge state={story.targetState} />
          </View>
          <Text style={sprintGoalSharePdfStyles.colTag}>{story.targetTac}</Text>
        </View>
      ))}

      {payload.overflowCount > 0 ? (
        <Text style={sprintGoalSharePdfStyles.overflowNote}>
          {formatSprintGoalShareOverflowMessage(payload.overflowCount)}
        </Text>
      ) : null}
    </View>
  );
}
