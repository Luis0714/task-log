import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";

/** Color real del badge por nivel de semáforo (verde/amarillo/rojo). */
const SEMAFORO_CLASS: Record<SemaforoLevel, string> = {
  verde:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/40",
  amarillo:
    "bg-amber-500/15 text-amber-700 border-amber-500/40 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/40",
  rojo:
    "bg-red-500/15 text-red-700 border-red-500/40 dark:bg-red-400/15 dark:text-red-300 dark:border-red-400/40",
};

export type ReportsTimeLogSemaforoBadgeProps = {
  level: SemaforoLevel | null;
  pct: number | null;
};

export function ReportsTimeLogSemaforoBadge({
  level,
  pct,
}: Readonly<ReportsTimeLogSemaforoBadgeProps>) {
  if (level === null) {
    return <Badge variant="outline">Sin configurar</Badge>;
  }
  return (
    <Badge variant="outline" className={cn("font-mono", SEMAFORO_CLASS[level])}>
      {pct ?? 0}%
    </Badge>
  );
}
