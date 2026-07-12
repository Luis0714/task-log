import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

type Column = {
  label: string;
  /** Clases extra para la celda (encabezado y cuerpo) de esta columna. */
  cellClassName?: string;
};

const COLUMNS: readonly Column[] = [
  { label: "Proyecto", cellClassName: "min-w-[12rem]" },
  { label: "Equipo", cellClassName: "min-w-[12rem]" },
  { label: "Usuario", cellClassName: "min-w-[14rem]" },
  { label: "% Asignación" },
  { label: "Días hábiles" },
  { label: "Horas esperadas" },
  { label: "Horas desarrollo" },
  { label: "Horas bugs" },
  { label: "Horas novedades" },
  { label: "Horas totales" },
  { label: "Cant. novedades" },
  { label: "Detalle de novedades" },
  { label: "% Cumplimiento" },
] as const;

export type ReportsTimeLogTableProps = {
  rows: readonly HoursReportRow[];
};

export function ReportsTimeLogTable({ rows }: Readonly<ReportsTimeLogTableProps>) {
  return (
    <TableShell>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={`${row.projectId}-${row.teamId ?? "none"}-${row.personDisplayName}-${idx}`}
            className="border-b last:border-b-0 hover:bg-muted/30"
          >
            <td className="px-3 py-2 min-w-[12rem]">{row.projectName}</td>
            <td className="px-3 py-2 min-w-[12rem]">{row.teamName ?? "—"}</td>
            <td className="px-3 py-2 min-w-[14rem] font-medium">{row.personDisplayName}</td>
            <td className="px-3 py-2">{formatAssignmentPct(row)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.workingDays}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.expectedHours.toFixed(1)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.developmentHours.toFixed(1)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.bugHours.toFixed(1)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.newsHours.toFixed(1)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-semibold">{row.totalHours.toFixed(1)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.newsCount}</td>
            <td className="px-3 py-2 max-w-xs whitespace-normal text-xs">
              {row.newsCount === 0 ? "Sin novedades" : row.newsDetail || "Sin novedades"}
            </td>
            <td className="px-3 py-2">
              <ReportsTimeLogSemaforoBadge level={row.semaforo} pct={row.compliancePct} />
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

export type ReportsTimeLogTableSkeletonProps = {
  rowCount?: number;
};

export function ReportsTimeLogTableSkeleton({
  rowCount = 6,
}: Readonly<ReportsTimeLogTableSkeletonProps>) {
  return (
    <TableShell>
      <tbody>
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <tr key={rowIdx} className="border-b last:border-b-0">
            {COLUMNS.map((col) => (
              <td key={col.label} className={cn("px-3 py-2", col.cellClassName)}>
                <Skeleton className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function TableShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                className={cn(
                  "px-3 py-2 text-left font-medium whitespace-nowrap",
                  col.cellClassName,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

function formatAssignmentPct(row: HoursReportRow): string {
  if (row.assignmentPct.kind === "exception") {
    return `${row.assignmentPct.weightedPct}%`;
  }
  if (row.assignmentPct.kind === "default") {
    return "100%";
  }
  return "Sin configurar";
}
