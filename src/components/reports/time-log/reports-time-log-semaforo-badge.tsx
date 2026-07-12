import { Badge } from "@/components/ui/badge";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";

const VARIANT: Record<SemaforoLevel, "default" | "secondary" | "destructive"> = {
  verde: "default",
  amarillo: "secondary",
  rojo: "destructive",
};

const LABEL: Record<SemaforoLevel, string> = {
  verde: "Verde",
  amarillo: "Amarillo",
  rojo: "Rojo",
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
    <Badge variant={VARIANT[level]} className="font-mono">
      {pct ?? 0}% · {LABEL[level]}
    </Badge>
  );
}