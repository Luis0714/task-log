import { formatReviewDuration } from "@/lib/review-times/duration";
import type { ReviewTimeAverages } from "@/lib/review-times/types";

function subtitle(count: number, singular: string, plural: string): string {
  if (count === 0) return "Sin datos en este filtro";
  return `Sobre ${count} ${count === 1 ? singular : plural}`;
}

function AverageCard({
  title,
  ms,
  detail,
}: Readonly<{ title: string; ms: number | null; detail: string }>) {
  return (
    <article className="bg-card rounded-md border p-4">
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {ms == null ? "—" : formatReviewDuration(ms)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
    </article>
  );
}

export function ReviewTimesSummary({ averages }: Readonly<{ averages: ReviewTimeAverages }>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <AverageCard
        title="Tiempo promedio de revisión"
        ms={averages.reviewMs}
        detail={subtitle(averages.reviewCount, "revisión", "revisiones")}
      />
      <AverageCard
        title="Tiempo promedio de aprobación"
        ms={averages.approvalMs}
        detail={subtitle(averages.approvalCount, "aprobación", "aprobaciones")}
      />
    </div>
  );
}
