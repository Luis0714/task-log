import { registerSprintGoalSharePdfFonts } from "@/lib/sprints/sprint-goal-share-pdf-fonts";
import { SprintGoalSharePdfFooterSection } from "@/lib/sprints/sprint-goal-share-pdf-footer-section";
import { SprintGoalSharePdfHeader } from "@/lib/sprints/sprint-goal-share-pdf-header";
import { SprintGoalSharePdfSummarySection } from "@/lib/sprints/sprint-goal-share-pdf-summary-section";
import { SprintGoalSharePdfTableSection } from "@/lib/sprints/sprint-goal-share-pdf-table-section";
import { sprintGoalSharePdfStyles } from "@/lib/sprints/sprint-goal-share-pdf-theme";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";
import { Document, Page } from "@react-pdf/renderer";

registerSprintGoalSharePdfFonts();

export type SprintGoalSharePdfDocumentProps = {
  payload: SprintGoalSharePayload;
};

export function SprintGoalSharePdfDocument({ payload }: SprintGoalSharePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" wrap style={sprintGoalSharePdfStyles.page}>
        <SprintGoalSharePdfHeader payload={payload} />
        <SprintGoalSharePdfSummarySection payload={payload} />
        <SprintGoalSharePdfTableSection payload={payload} />
        <SprintGoalSharePdfFooterSection payload={payload} />
      </Page>
    </Document>
  );
}
