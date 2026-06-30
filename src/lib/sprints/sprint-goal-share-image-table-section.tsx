import { formatSprintGoalShareOverflowMessage } from "@/lib/sprints/sprint-goal-share-content";
import { SPRINT_GOAL_SHARE_LABELS } from "@/lib/sprints/sprint-goal-share-labels";
import { SprintGoalShareImageStateBadge } from "@/lib/sprints/sprint-goal-share-image-state-badge";
import {
  SPRINT_GOAL_SHARE_IMAGE_LAYOUT,
  sprintGoalShareImageColors,
  truncateSprintGoalShareText,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

const STORY_TITLE_MAX_LENGTH = 52;
const TAGS_MAX_LENGTH = 40;

export type SprintGoalShareImageTableSectionProps = {
  payload: SprintGoalSharePayload;
};

const COLUMN_FLEX = {
  story: 2,
  state: 0.95,
  tags: 1.05,
} as const;

const centeredCellStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  padding: "0 6px",
  overflow: "hidden",
};

function ShareImageHeaderCell({
  label,
  flex,
}: {
  label: string;
  flex: number;
}) {
  return (
    <span
      style={{
        flex,
        ...centeredCellStyle,
        fontSize: 11,
        fontWeight: 700,
        color: sprintGoalShareImageColors.muted,
      }}
    >
      {label}
    </span>
  );
}

function ShareImageStateCell({
  state,
  flex,
  backlogStates,
}: Readonly<{
  state: string;
  flex: number;
  backlogStates: SprintGoalSharePayload["backlogStates"];
}>) {
  return (
    <span style={{ flex, ...centeredCellStyle }}>
      <SprintGoalShareImageStateBadge state={state} backlogStates={backlogStates} />
    </span>
  );
}

function ShareImageTagsCell({ value, flex }: { value: string; flex: number }) {
  return (
    <span
      style={{
        flex,
        ...centeredCellStyle,
        color: sprintGoalShareImageColors.muted,
        fontSize: 13,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={value}
    >
      {truncateSprintGoalShareText(value, TAGS_MAX_LENGTH)}
    </span>
  );
}

export function SprintGoalShareImageTableSection({ payload }: SprintGoalShareImageTableSectionProps) {
  const { horizontalPadding, tableHeaderHeight, tableRowHeight, overflowHeight } =
    SPRINT_GOAL_SHARE_IMAGE_LAYOUT;
  const labels = SPRINT_GOAL_SHARE_LABELS;
  const { story, state, tags } = COLUMN_FLEX;

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
        }}
      >
        <ShareImageHeaderCell label={labels.userStoryColumn} flex={story} />
        <ShareImageHeaderCell label={labels.originalStateColumn} flex={state} />
        <ShareImageHeaderCell label={labels.originalTagsColumn} flex={tags} />
        <ShareImageHeaderCell label={labels.targetStateColumn} flex={state} />
        <ShareImageHeaderCell label={labels.targetTagsColumn} flex={tags} />
        <ShareImageHeaderCell label={labels.currentStateColumn} flex={state} />
        <ShareImageHeaderCell label={labels.currentTagsColumn} flex={tags} />
      </div>

      {payload.visibleStories.map((storyRow) => (
        <div
          key={storyRow.workItemId}
          style={{
            display: "flex",
            alignItems: "center",
            height: tableRowHeight,
            borderBottom: `1px solid ${sprintGoalShareImageColors.border}`,
            fontSize: 14,
          }}
        >
          <span
            style={{
              flex: story,
              ...centeredCellStyle,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 700 }}>#{storyRow.workItemId}</span>
            {" · "}
            <span style={{ color: sprintGoalShareImageColors.muted }}>
              {truncateSprintGoalShareText(storyRow.title, STORY_TITLE_MAX_LENGTH)}
            </span>
          </span>
          <ShareImageStateCell state={storyRow.originalState} flex={state} backlogStates={payload.backlogStates} />
          <ShareImageTagsCell value={storyRow.originalTags} flex={tags} />
          <ShareImageStateCell state={storyRow.targetState} flex={state} backlogStates={payload.backlogStates} />
          <ShareImageTagsCell value={storyRow.targetTags} flex={tags} />
          <ShareImageStateCell state={storyRow.currentState} flex={state} backlogStates={payload.backlogStates} />
          <ShareImageTagsCell value={storyRow.currentTags} flex={tags} />
        </div>
      ))}

      {payload.overflowCount > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: overflowHeight,
            padding: "0 12px",
            fontSize: 14,
            color: sprintGoalShareImageColors.muted,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {formatSprintGoalShareOverflowMessage(payload.overflowCount)}
        </div>
      ) : null}
    </div>
  );
}
