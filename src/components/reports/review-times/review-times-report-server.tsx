import { ReviewTimesResults } from "@/components/reports/review-times/review-times-results";
import { loadReviewTimes } from "@/lib/review-times/load-review-times";
import type { ReviewTimesSnapshot } from "@/lib/review-times/load-review-times";

export async function ReviewTimesReportServer({
  project,
  monthKey,
  repositories,
  timeZone,
}: Readonly<{
  project: string;
  monthKey: string;
  repositories: readonly string[];
  timeZone: string;
}>) {
  let report: ReviewTimesSnapshot | null = null;
  let error: string | null = null;
  try {
    report = await loadReviewTimes({ project, monthKey, repositories });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "No se pudieron calcular los tiempos de revisión.";
  }

  return (
    <ReviewTimesResults report={report} error={error} timeZone={timeZone} project={project} />
  );
}
