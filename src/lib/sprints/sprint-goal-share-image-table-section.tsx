import { formatSprintGoalShareOverflowMessage } from "@/lib/sprints/sprint-goal-share-content";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalShareImageStateBadge } from "@/lib/sprints/sprint-goal-share-image-state-badge";
import {
  SPRINT_GOAL_SHARE_IMAGE_LAYOUT,
  sprintGoalShareImageColors,
  truncateSprintGoalShareText,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

const STORY_TITLE_MAX_LENGTH = 64;

export type SprintGoalShareImageTableSectionProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalShareImageTableSection({ payload }: SprintGoalShareImageTableSectionProps) {
  const { horizontalPadding, tableHeaderHeight, tableRowHeight, overflowHeight } =
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: `0 ${horizontalPadding}px`,
        backgroundColor: sprintGoalShareImageColors.card,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: tableHeaderHeight,
          borderBottom: `1px solid ${sprintGoalShareImageColors.border}`,
          backgroundColor: sprintGoalShareImageColors.tableHeader,
          fontSize: 14,
          fontWeight: 700,
          color: sprintGoalShareImageColors.muted,
        }}
      >
        <span style={{ flex: 2, paddingLeft: 12 }}>{SPRINT_GOAL_SHARE_LABELS.userStoryColumn}</span>
        <span style={{ flex: 1, paddingLeft: 12 }}>{SPRINT_GOAL_SHARE_LABELS.stateColumn}</span>
        <span style={{ flex: 1, paddingLeft: 12 }}>{SPRINT_GOAL_SHARE_LABELS.tagColumn}</span>
      </div>

      {payload.visibleStories.map((story) => (
        <div
          key={story.workItemId}
          style={{
            display: "flex",
            alignItems: "center",
            height: tableRowHeight,
            borderBottom: `1px solid ${sprintGoalShareImageColors.border}`,
            fontSize: 15,
          }}
        >
          <span
            style={{
              flex: 2,
              padding: "0 12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 700 }}>#{story.workItemId}</span>
            {" · "}
            <span style={{ color: sprintGoalShareImageColors.muted }}>
              {truncateSprintGoalShareText(story.title, STORY_TITLE_MAX_LENGTH)}
            </span>
          </span>
          <span
            style={{
              flex: 1,
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <SprintGoalShareImageStateBadge state={story.targetState} />
          </span>
          <span
            style={{
              flex: 1,
              padding: "0 12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {story.targetTac}
          </span>
        </div>
      ))}

      {payload.overflowCount > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: overflowHeight,
            padding: "0 12px",
            fontSize: 14,
            color: sprintGoalShareImageColors.muted,
            fontStyle: "italic",
          }}
        >
          {formatSprintGoalShareOverflowMessage(payload.overflowCount)}
        </div>
      ) : null}
    </div>
  );
}
