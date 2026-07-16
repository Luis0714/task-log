import type { StickyTableColumn } from "@/components/ui/sticky-table";
import { TruncatedTextTooltip } from "@/components/ui/truncated-text-tooltip";
import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

export function formatAssignmentPct(row: HoursReportRow): string {
  if (row.assignmentPct.kind === "exception") {
    return `${row.assignmentPct.weightedPct}%`;
  }
  if (row.assignmentPct.kind === "default") {
    return "100%";
  }
  return "Sin configurar";
}

export const REPORTS_TIME_LOG_COLUMNS: readonly StickyTableColumn<HoursReportRow>[] = [
  {
    key: "proyecto",
    header: "Proyecto",
    widthClass: "w-48",
    sticky: { leftClass: "left-0" },
    align: "left",
    render: (row) => <TruncatedTextTooltip text={row.projectName} />,
  },
  {
    key: "equipo",
    header: "Equipo",
    widthClass: "w-48",
    sticky: { leftClass: "left-48" },
    align: "left",
    render: (row) =>
      row.teamName ? <TruncatedTextTooltip text={row.teamName} /> : "—",
  },
  {
    key: "usuario",
    header: "Usuario",
    widthClass: "w-56",
    sticky: { leftClass: "left-96", isLast: true },
    align: "left",
    bodyClassName: "font-medium",
    render: (row) => <TruncatedTextTooltip text={row.personDisplayName} />,
  },
  {
    key: "assignmentPct",
    header: "% Asignación",
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center",
    render: formatAssignmentPct,
  },
  {
    key: "workingDays",
    header: "Días hábiles",
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.workingDays,
  },
  {
    key: "expectedHours",
    header: "Horas esperadas",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.expectedHours.toFixed(1),
  },
  {
    key: "developmentHours",
    header: "Horas desarrollo",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.developmentHours.toFixed(1),
  },
  {
    key: "bugHours",
    header: "Horas bugs",
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.bugHours.toFixed(1),
  },
  {
    key: "newsCount",
    header: "Cant. novedades",
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsCount,
  },
  {
    key: "newsHours",
    header: "Horas novedades",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsHours.toFixed(1),
  },
  {
    key: "newsDays",
    header: "Días novedades",
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsDays ?? 0,
  },
  {
    key: "newsDetail",
    header: "Detalle de novedades",
    widthClass: "w-64",
    align: "center",
    bodyClassName: "text-center text-xs",
    render: (row) => {
      if (row.newsCount === 0 || (row.newsDetails?.length ?? 0) === 0) {
        return "Sin novedades";
      }
      return (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="mx-auto block max-w-[16rem] cursor-default truncate" />
            }
          >
            {row.newsDetail}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <ol className="list-inside list-decimal space-y-0.5 text-left">
              {(row.newsDetails ?? []).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ol>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    key: "workedHours",
    header: "Horas trabajadas",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums font-medium",
    render: (row) => row.workedHours.toFixed(1),
  },
  {
    key: "totalHours",
    header: "Horas totales",
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums font-semibold",
    render: (row) => row.totalHours.toFixed(1),
  },
  {
    key: "compliance",
    header: "% Cumplimiento",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center",
    render: (row) => (
      <ReportsTimeLogSemaforoBadge level={row.semaforo} pct={row.compliancePct} />
    ),
  },
  {
    key: "deviation",
    header: "% Desviación",
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center",
    render: (row) => (
      <ReportsTimeLogSemaforoBadge level={row.deviationLevel} pct={row.deviationPct} />
    ),
  },
];
