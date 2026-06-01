import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { SprintGoalShareImageFooterSection } from "@/lib/sprints/sprint-goal-share-image-footer-section";
import { SprintGoalShareImageHeader } from "@/lib/sprints/sprint-goal-share-image-header";
import { SprintGoalShareImageSummarySection } from "@/lib/sprints/sprint-goal-share-image-summary-section";
import { SprintGoalShareImageTableSection } from "@/lib/sprints/sprint-goal-share-image-table-section";
import {
  getSprintGoalShareImageSize,
  sprintGoalShareImageColors,
} from "@/lib/sprints/sprint-goal-share-image-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export { getSprintGoalShareImageSize };

export type SprintGoalShareImageProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalShareImage({ payload }: SprintGoalShareImageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: sprintGoalShareImageColors.background,
        color: sprintGoalShareImageColors.text,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <SprintGoalShareImageHeader payload={payload} />
      <SprintGoalShareImageSummarySection payload={payload} />
      <SprintGoalShareImageTableSection payload={payload} />
      <SprintGoalShareImageFooterSection payload={payload} />
    </div>
  );
}
