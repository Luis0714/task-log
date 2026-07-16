import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeviationLevel } from "@/lib/reports/hours/deviation";

/**
 * Color del badge de desviación. La dirección la marca el cumplimiento
 * respecto al 100% (rojo si trabaja menos, azul si trabaja más, verde exacto),
 * y la magnitud delata si la situación es leve, media o fuerte.
 */
const DEVIATION_CLASS: Record<DeviationLevel, string> = {
  exact:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/40",
  "under-light":
    "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/30",
  "under-medium":
    "bg-red-500/15 text-red-700 border-red-500/40 dark:bg-red-400/15 dark:text-red-300 dark:border-red-400/40",
  "under-strong":
    "bg-red-500/25 text-red-800 border-red-500/55 dark:bg-red-400/25 dark:text-red-200 dark:border-red-400/55",
  "over-light":
    "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/30",
  "over-medium":
    "bg-sky-500/15 text-sky-700 border-sky-500/40 dark:bg-sky-400/15 dark:text-sky-300 dark:border-sky-400/40",
  "over-strong":
    "bg-sky-500/25 text-sky-800 border-sky-500/55 dark:bg-sky-400/25 dark:text-sky-200 dark:border-sky-400/55",
};

export type ReportsTimeLogDeviationBadgeProps = Readonly<{
  level: DeviationLevel | null;
  pct: number | null;
}>;

/**
 * Badge con la escala de colores específica para "% Desviación".
 * Se diferencia del semáforo (verde/amarillo/rojo) en que pinta de azul el
 * sobrecumplimiento para distinguirlo claramente del incumplimiento.
 */
export function ReportsTimeLogDeviationBadge({
  level,
  pct,
}: ReportsTimeLogDeviationBadgeProps) {
  if (level === null) {
    return <Badge variant="outline">Sin configurar</Badge>;
  }
  return (
    <Badge variant="outline" className={cn("font-mono", DEVIATION_CLASS[level])}>
      {pct ?? 0}%
    </Badge>
  );
}
