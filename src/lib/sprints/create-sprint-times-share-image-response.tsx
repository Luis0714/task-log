import { ImageResponse } from "next/og";

import { buildSprintTimesShareDownloadFilename } from "@/lib/sprints/format-sprint-times-share";
import { loadSprintGoalShareFonts } from "@/lib/sprints/load-sprint-goal-share-fonts";
import {
  getSprintTimesShareImageSize,
  SprintTimesShareImage,
} from "@/lib/sprints/sprint-times-share-image";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";

export async function createSprintTimesShareImageResponse(payload: SprintTimesSharePayload) {
  const fonts = await loadSprintGoalShareFonts();
  const imageSize = getSprintTimesShareImageSize(payload);
  const filename = buildSprintTimesShareDownloadFilename(
    payload.sprintName,
    payload.variant,
    payload.generatedAt,
  );

  return new ImageResponse(<SprintTimesShareImage payload={payload} />, {
    ...imageSize,
    fonts,
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
