import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { SprintTimesShareImageFooterSection } from "@/lib/sprints/sprint-times-share-image-footer-section";
import { SprintTimesShareImageHeader } from "@/lib/sprints/sprint-times-share-image-header";
import { SprintTimesShareImageLegendSection } from "@/lib/sprints/sprint-times-share-image-legend-section";
import { SprintTimesShareImageTableSection } from "@/lib/sprints/sprint-times-share-image-table-section";
import {
  getSprintTimesShareImageSize,
  sprintTimesShareImageTheme,
} from "@/lib/sprints/sprint-times-share-image-theme";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";

export { getSprintTimesShareImageSize };

export function SprintTimesShareImage({ payload }: { payload: SprintTimesSharePayload }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: sprintTimesShareImageTheme.background,
        color: sprintTimesShareImageTheme.text,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <SprintTimesShareImageHeader payload={payload} />
      <SprintTimesShareImageLegendSection />
      <SprintTimesShareImageTableSection payload={payload} />
      <SprintTimesShareImageFooterSection payload={payload} />
    </div>
  );
}
