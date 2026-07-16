import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

export function ReportsTimeLogRowCard({
  row,
}: Readonly<{ row: HoursReportRow }>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={row.personDisplayName}>
            {row.personDisplayName}
          </p>
          <p className="text-muted-foreground truncate text-xs" title={row.projectName}>
            {row.projectName}
            {row.teamName ? ` · ${row.teamName}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Cumpl.</span>
            <ReportsTimeLogSemaforoBadge level={row.semaforo} pct={row.compliancePct} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Desv.</span>
            <ReportsTimeLogSemaforoBadge
              level={row.deviationLevel}
              pct={row.deviationPct}
            />
          </div>
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>
          Dev:{" "}
          <span className="text-foreground tabular-nums">
            {row.developmentHours.toFixed(1)} h
          </span>
        </span>
        <span>
          Bugs:{" "}
          <span className="text-foreground tabular-nums">
            {row.bugHours.toFixed(1)} h
          </span>
        </span>
        <span>
          Trabajadas:{" "}
          <span className="text-foreground font-medium tabular-nums">
            {row.workedHours.toFixed(1)} h
          </span>
        </span>
        <span>
          Total:{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {row.totalHours.toFixed(1)} h
          </span>
        </span>
      </div>
    </div>
  );
}
