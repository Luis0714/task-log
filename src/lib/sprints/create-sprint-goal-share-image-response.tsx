import { ImageResponse } from "next/og";

import { buildSprintGoalShareDownloadFilename } from "@/lib/sprints/format-sprint-goal-share";
import { loadSprintGoalShareFonts } from "@/lib/sprints/load-sprint-goal-share-fonts";
import {
  getSprintGoalShareImageSize,
  SprintGoalShareImage,
} from "@/lib/sprints/sprint-goal-share-image";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export async function createSprintGoalShareImageResponse(
  payload: SprintGoalSharePayload,
) {
  const fonts = await loadSprintGoalShareFonts();
  const imageSize = getSprintGoalShareImageSize(payload);
  const filename = buildSprintGoalShareDownloadFilename(
    payload.sprintName,
    payload.generatedAt,
  );

  return new ImageResponse(<SprintGoalShareImage payload={payload} />, {
    ...imageSize,
    fonts,
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
