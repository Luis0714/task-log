import type { StickyTableColumn } from "@/components/ui/sticky-table";
import { TruncatedTextTooltip } from "@/components/ui/truncated-text-tooltip";
import { ReportsTimeLogSemaforoBadge } from "@/components/reports/time-log/reports-time-log-semaforo-badge";
import { ReportsTimeLogDeviationBadge } from "@/components/reports/time-log/reports-time-log-deviation-badge";
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

function ColumnHeader({
  label,
  tooltip,
}: Readonly<{ label: string; tooltip: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="decoration-muted-foreground/40 -mx-3 -my-2 block cursor-default px-3 py-2 underline decoration-dotted underline-offset-4" />
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export const REPORTS_TIME_LOG_COLUMNS: readonly StickyTableColumn<HoursReportRow>[] = [
  {
    key: "proyecto",
    header: (
      <ColumnHeader
        label="Proyecto"
        tooltip="Proyecto al que pertenece la persona."
      />
    ),
    widthClass: "w-48",
    sticky: { leftClass: "left-0" },
    align: "left",
    render: (row) => <TruncatedTextTooltip text={row.projectName} />,
  },
  {
    key: "equipo",
    header: (
      <ColumnHeader
        label="Equipo"
        tooltip="Equipo del proyecto al que pertenece la persona."
      />
    ),
    widthClass: "w-48",
    sticky: { leftClass: "left-48" },
    align: "left",
    render: (row) =>
      row.teamName ? <TruncatedTextTooltip text={row.teamName} /> : "—",
  },
  {
    key: "usuario",
    header: (
      <ColumnHeader
        label="Usuario"
        tooltip="Colaborador analizado en el reporte."
      />
    ),
    widthClass: "w-56",
    sticky: { leftClass: "left-96", isLast: true },
    align: "left",
    bodyClassName: "font-medium",
    render: (row) => <TruncatedTextTooltip text={row.personDisplayName} />,
  },
  {
    key: "assignmentPct",
    header: (
      <ColumnHeader
        label="% Asignación"
        tooltip="Dedicación asignada a la persona en este proyecto/equipo."
      />
    ),
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center",
    render: formatAssignmentPct,
  },
  {
    key: "developmentHours",
    header: (
      <ColumnHeader
        label="Horas desarrollo"
        tooltip="Horas dedicadas a construir el producto (desarrollo, diseño, QA…) en el período seleccionado."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.developmentHours.toFixed(1),
  },
  {
    key: "bugHours",
    header: (
      <ColumnHeader
        label="Horas bugs"
        tooltip="Horas invertidas en la solución de bugs en el período seleccionado."
      />
    ),
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.bugHours.toFixed(1),
  },
  {
    key: "newsCount",
    header: (
      <ColumnHeader
        label="Cant. novedades"
        tooltip="Cantidad de novedades de la persona en el período seleccionado."
      />
    ),
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsCount,
  },
  {
    key: "newsDays",
    header: (
      <ColumnHeader
        label="Días novedades"
        tooltip="Días equivalentes de las novedades en el período (horas ÷ 8)."
      />
    ),
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsDays ?? 0,
  },
  {
    key: "newsDetail",
    header: (
      <ColumnHeader
        label="Detalle de novedades"
        tooltip="Tipo y título de cada novedad reportada por la persona en el período."
      />
    ),
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
    key: "newsHours",
    header: (
      <ColumnHeader
        label="Horas novedades"
        tooltip="Horas que sumaron las novedades de la persona en el período seleccionado."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.newsHours.toFixed(1),
  },
  {
    key: "workedHours",
    header: (
      <ColumnHeader
        label="Horas trabajadas"
        tooltip="Horas desarrollo + horas bugs."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums font-medium",
    render: (row) => row.workedHours.toFixed(1),
  },
  {
    key: "totalHours",
    header: (
      <ColumnHeader
        label="Horas totales"
        tooltip="Horas trabajadas + horas novedades."
      />
    ),
    widthClass: "w-36",
    align: "center",
    bodyClassName: "text-center tabular-nums font-semibold",
    render: (row) => row.totalHours.toFixed(1),
  },
  {
    key: "expectedHours",
    header: (
      <ColumnHeader
        label="Horas esperadas"
        tooltip="Horas que debería registrar la persona según los días hábiles del período y su % de asignación."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.expectedHours.toFixed(1),
  },
  {
    key: "workingDays",
    header: (
      <ColumnHeader
        label="Días hábiles"
        tooltip="Días laborales del rango de fechas o mes seleccionado."
      />
    ),
    widthClass: "w-32",
    align: "center",
    bodyClassName: "text-center tabular-nums",
    render: (row) => row.workingDays,
  },
  {
    key: "compliance",
    header: (
      <ColumnHeader
        label="% Cumplimiento"
        tooltip="Horas reportadas vs. esperadas según su asignación. 100% = exacto."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center",
    render: (row) => (
      <ReportsTimeLogSemaforoBadge level={row.semaforo} pct={row.compliancePct} />
    ),
  },
  {
    key: "deviation",
    header: (
      <ColumnHeader
        label="% Desviación"
        tooltip="Distancia al 100% de cumplimiento. Rojo = trabajó menos, azul = trabajó más."
      />
    ),
    widthClass: "w-40",
    align: "center",
    bodyClassName: "text-center",
    render: (row) => (
      <ReportsTimeLogDeviationBadge level={row.deviationLevel} pct={row.deviationPct} />
    ),
  },
];
