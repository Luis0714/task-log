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
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 md:grid-cols-2">
        <AverageCard
          title="Tiempo promedio hasta la primera revisión"
          ms={averages.reviewMs}
          detail={subtitle(averages.reviewCount, "pull request", "pull requests")}
        />
        <AverageCard
          title="Tiempo promedio hasta la aprobación de la persona requerida"
          ms={averages.approvalMs}
          detail={subtitle(averages.approvalCount, "pull request", "pull requests")}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Los tiempos cuentan solo de lunes a viernes, entre las 8:00 y las 17:00.
      </p>
    </div>
  );
}
