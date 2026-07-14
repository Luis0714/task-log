"use client";

import { ExternalLink, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { DeleteSolicitudDialog } from "@/components/solicitudes/delete-solicitud-dialog";
import { formatSolicitudDateTime } from "@/lib/solicitudes/time-calc";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

function formatHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  return `${hours} h`;
}

/** Wrapper tolerante a `null` para la columna/línea de cada fecha. */
function formatDateTime(dateKey: string | null, timeStr: string | null): string {
  if (!dateKey) return "—";
  return formatSolicitudDateTime(dateKey, timeStr);
}

/**
 * Listado maestro de campos que muestran ambas vistas (móvil/escritorio) de la
 * tabla. Cada entry indica cómo extraer el valor ya formateado; las vistas
 * sólo eligen el layout (lista o celdas). Mantener una sola fuente de verdad
 * aquí evita que las dos vistas se desincronicen al añadir un campo nuevo.
 */
type SolicitudField = Readonly<{
  key: string;
  label: string;
  getValue: (solicitud: SolicitudDto) => string;
}>;

const SOLICITUD_FIELDS: readonly SolicitudField[] = [
  { key: "tipo", label: "Tipo", getValue: (s) => s.tipo ?? "—" },
  { key: "assignedTo", label: "Asignado", getValue: (s) => s.assignedTo ?? "—" },
  { key: "fechaInicio", label: "Inicio", getValue: (s) => formatDateTime(s.fechaInicio, s.fechaInicioHora) },
  { key: "fechaFin", label: "Fin", getValue: (s) => formatDateTime(s.fechaFin, s.fechaFinHora) },
  { key: "fechaReintegro", label: "Reintegro", getValue: (s) => formatDateTime(s.fechaReintegro, s.fechaReintegroHora) },
  { key: "hours", label: "Horas", getValue: (s) => formatHours(s.hours) },
];

export type SolicitudesTableProps = Readonly<{
  solicitudes: readonly SolicitudDto[];
  /** Proyecto activo: necesario para autorizar la eliminación en Azure DevOps. */
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
}>;

export function SolicitudesTable({
  solicitudes,
  project,
  onEdit,
  onDeleted,
}: SolicitudesTableProps) {
  if (solicitudes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Aún no tienes solicitudes registradas.</p>
      </div>
    );
  }

  return (
    <>
      {/* Móvil: tarjetas apiladas, sin scroll horizontal. */}
      <ul className="space-y-3 md:hidden">
        {solicitudes.map((solicitud) => (
          <li key={solicitud.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 font-medium wrap-break-word" title={solicitud.title}>
                {solicitud.title}
              </p>
              <AzureDevOpsLink solicitud={solicitud} variant="icon" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {SOLICITUD_FIELDS.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={field.getValue(solicitud)}
                />
              ))}
              <Field label="Estado" value={solicitud.state || "—"} />
            </dl>
            <div className="mt-3 flex items-center justify-end gap-1">
              <SolicitudActions
                solicitud={solicitud}
                project={project}
                onEdit={onEdit}
                onDeleted={onDeleted}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla; el scroll horizontal es solo respaldo para pantallas muy angostas. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {SOLICITUD_FIELDS.map((field) => (
                <th key={field.key} className="px-3 py-2 font-medium">
                  {field.label}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
              <th className="px-3 py-2 text-right font-medium">Azure</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {solicitudes.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-muted/30">
                {SOLICITUD_FIELDS.map((field) => (
                  <SolicitudFieldCell
                    key={field.key}
                    field={field}
                    solicitud={solicitud}
                  />
                ))}
                <td className="min-w-32 px-3 py-2 text-right">
                  {solicitud.state ? <WorkItemStateBadge state={solicitud.state} /> : "—"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <SolicitudActions
                      solicitud={solicitud}
                      project={project}
                      onEdit={onEdit}
                      onDeleted={onDeleted}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <AzureDevOpsLink solicitud={solicitud} variant="compact-with-id" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SolicitudFieldCell({
  field,
  solicitud,
}: Readonly<{
  field: SolicitudField;
  solicitud: SolicitudDto;
}>) {
  const value = field.getValue(solicitud);
  // "Tipo" suele ser largo: tooltip con el valor completo cuando se trunca.
  if (field.key === "tipo") {
    return (
      <td className="max-w-[160px] min-w-[120px] truncate px-3 py-2">
        {solicitud.tipo ? (
          <Tooltip>
            <TooltipTrigger render={<span className="block cursor-default truncate" />}>
              {value}
            </TooltipTrigger>
            <TooltipContent>{value}</TooltipContent>
          </Tooltip>
        ) : (
          value
        )}
      </td>
    );
  }
  if (field.key === "assignedTo") {
    return (
      <td
        className="max-w-[220px] min-w-[180px] truncate px-3 py-2"
        title={solicitud.assignedTo ?? undefined}
      >
        {value}
      </td>
    );
  }
  if (field.key === "hours") {
    return (
      <td className="px-3 py-2 text-right whitespace-nowrap">{value}</td>
    );
  }
  return <td className="px-3 py-2 whitespace-nowrap">{value}</td>;
}

function SolicitudActions({
  solicitud,
  project,
  onEdit,
  onDeleted,
}: Readonly<{
  solicitud: SolicitudDto;
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
}>) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar solicitud #${solicitud.id}`}
              onClick={() => onEdit(solicitud)}
            />
          }
        >
          <Pencil aria-hidden />
        </TooltipTrigger>
        <TooltipContent>Editar solicitud</TooltipContent>
      </Tooltip>
      <DeleteSolicitudDialog
        workItemId={solicitud.id}
        project={project}
        itemTitle={solicitud.title}
        onDeleted={() => onDeleted(solicitud)}
      />
    </>
  );
}

function AzureDevOpsLink({
  solicitud,
  variant,
}: Readonly<{
  solicitud: SolicitudDto;
  variant: "icon" | "compact-with-id";
}>) {
  const ariaLabel = `Abrir novedad #${solicitud.id} en Azure DevOps`;
  const tooltipText = `Abrir novedad #${solicitud.id} en Azure DevOps`;

  if (variant === "compact-with-id") {
    return (
      <a
        href={solicitud.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
        title={tooltipText}
        aria-label={ariaLabel}
      >
        #{solicitud.id}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={solicitud.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center"
            aria-label={ariaLabel}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        }
      />
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

function Field({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}
