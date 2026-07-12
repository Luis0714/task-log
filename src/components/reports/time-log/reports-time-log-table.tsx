import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

const COLUMNS = [
  "Proyecto",
  "Equipo",
  "Usuario",
  "% Asignación",
  "Días hábiles",
  "Horas esperadas",
  "Horas desarrollo",
  "Horas bugs",
  "Horas novedades",
  "Horas totales",
  "Cant. novedades",
  "Detalle de novedades",
  "% Cumplimiento",
] as const;

export type ReportsTimeLogTableProps = {
  rows: readonly HoursReportRow[];
};

export function ReportsTimeLogTable({ rows }: Readonly<ReportsTimeLogTableProps>) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            {COLUMNS.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.projectId}-${row.teamId ?? "none"}-${row.personDisplayName}-${idx}`} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-3 py-2">{row.projectName}</td>
              <td className="px-3 py-2">{row.teamName ?? "—"}</td>
              <td className="px-3 py-2 font-medium">{row.personDisplayName}</td>
              <td className="px-3 py-2">{formatAssignmentPct(row)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.workingDays}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.expectedHours.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.developmentHours.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.bugHours.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.newsHours.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{row.totalHours.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.newsCount}</td>
              <td className="px-3 py-2 max-w-xs whitespace-normal text-xs">{row.newsDetail || "—"}</td>
              <td className="px-3 py-2">
                <ReportsTimeLogSemaforoBadge level={row.semaforo} pct={row.compliancePct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatAssignmentPct(row: HoursReportRow): string {
  if (row.assignmentPct.kind === "exception") {
    return `${row.assignmentPct.weightedPct}%`;
  }
  if (row.assignmentPct.kind === "default") {
    return "100% (por defecto)";
  }
  return "Sin configurar";
}