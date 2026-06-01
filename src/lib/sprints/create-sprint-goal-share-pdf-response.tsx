import { renderToBuffer } from "@react-pdf/renderer";

import { buildSprintGoalShareDownloadFilename } from "@/lib/sprints/format-sprint-goal-share";
import { SprintGoalSharePdfDocument } from "@/lib/sprints/sprint-goal-share-pdf-document";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

export async function createSprintGoalSharePdfResponse(payload: SprintGoalSharePayload) {
  const buffer = await renderToBuffer(<SprintGoalSharePdfDocument payload={payload} />);
  const filename = buildSprintGoalShareDownloadFilename(
    payload.sprintName,
    "pdf",
    payload.generatedAt,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
