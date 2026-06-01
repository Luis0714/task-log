import {
  formatSprintGoalShareOverflowMessage,
  formatSprintGoalShareStoryTitle,
} from "@/lib/sprints/sprint-goal-share-content";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalSharePdfStateBadge } from "@/lib/sprints/sprint-goal-share-pdf-state-badge";
import { sprintGoalSharePdfStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Text, View } from "@react-pdf/renderer";

const STORY_TITLE_MAX_LENGTH = 64;

export type SprintGoalSharePdfTableSectionProps = {
  payload: SprintGoalSharePayload;
};

function SharePdfHeaderCell({ label }: { label: string }) {
  return (
    <View style={sprintGoalSharePdfStyles.colStateCell}>
      <Text style={sprintGoalSharePdfStyles.colHeaderText}>{label}</Text>
    </View>
  );
}

function SharePdfTagsHeaderCell({ label }: { label: string }) {
  return (
    <View style={sprintGoalSharePdfStyles.colTagsCell}>
      <Text style={[sprintGoalSharePdfStyles.colTags, sprintGoalSharePdfStyles.colHeaderText]}>
        {label}
      </Text>
    </View>
  );
}

function SharePdfStateCell({ state }: { state: string }) {
  return (
    <View style={sprintGoalSharePdfStyles.colStateCell}>
      <SprintGoalSharePdfStateBadge state={state} />
    </View>
  );
}

function SharePdfTagsCell({ value }: { value: string }) {
  return (
    <View style={sprintGoalSharePdfStyles.colTagsCell}>
      <Text style={sprintGoalSharePdfStyles.colTags}>{value}</Text>
    </View>
  );
}

export function SprintGoalSharePdfTableSection({ payload }: SprintGoalSharePdfTableSectionProps) {
  const labels = SPRINT_GOAL_SHARE_LABELS;

  return (
    <View>
      <View style={sprintGoalSharePdfStyles.tableHeader}>
        <Text style={[sprintGoalSharePdfStyles.colStory, sprintGoalSharePdfStyles.colHeaderText]}>
          {labels.userStoryColumn}
        </Text>
        <SharePdfHeaderCell label={labels.originalStateColumn} />
        <SharePdfTagsHeaderCell label={labels.originalTagsColumn} />
        <SharePdfHeaderCell label={labels.targetStateColumn} />
        <SharePdfTagsHeaderCell label={labels.targetTagsColumn} />
        <SharePdfHeaderCell label={labels.currentStateColumn} />
        <SharePdfTagsHeaderCell label={labels.currentTagsColumn} />
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
          <SharePdfStateCell state={story.originalState} />
          <SharePdfTagsCell value={story.originalTags} />
          <SharePdfStateCell state={story.targetState} />
          <SharePdfTagsCell value={story.targetTags} />
          <SharePdfStateCell state={story.currentState} />
          <SharePdfTagsCell value={story.currentTags} />
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
