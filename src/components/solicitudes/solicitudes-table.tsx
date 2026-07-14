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
              <p className="min-w-0 flex-1 font-medium break-words" title={solicitud.title}>
                {solicitud.title}
              </p>
              <AzureLink solicitud={solicitud} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <Field label="Tipo" value={solicitud.tipo ?? "—"} />
              <Field label="Asignado" value={solicitud.assignedTo ?? "—"} />
              <Field label="Inicio" value={formatDateTime(solicitud.fechaInicio, solicitud.fechaInicioHora)} />
              <Field label="Fin" value={formatDateTime(solicitud.fechaFin, solicitud.fechaFinHora)} />
              <Field label="Reintegro" value={formatDateTime(solicitud.fechaReintegro, solicitud.fechaReintegroHora)} />
              <Field label="Horas" value={formatHours(solicitud.hours)} />
              <Field label="Estado" value={solicitud.state || "—"} />
            </dl>
            <div className="mt-3 flex items-center justify-end gap-1">
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
            </div>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla; el scroll horizontal es solo respaldo para pantallas muy angostas. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Asignado</th>
              <th className="px-3 py-2 font-medium">Inicio</th>
              <th className="px-3 py-2 font-medium">Fin</th>
              <th className="px-3 py-2 font-medium">Reintegro</th>
              <th className="px-3 py-2 text-right font-medium">Horas</th>
              <th className="px-3 py-2 text-right font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
              <th className="px-3 py-2 text-right font-medium">Azure</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {solicitudes.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-muted/30">
                <td className="max-w-[160px] min-w-[120px] truncate px-3 py-2">
                  {solicitud.tipo ? (
                    <Tooltip>
                      <TooltipTrigger render={<span className="block cursor-default truncate" />}>
                        {solicitud.tipo}
                      </TooltipTrigger>
                      <TooltipContent>{solicitud.tipo}</TooltipContent>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
                <td
                  className="max-w-[220px] min-w-[180px] truncate px-3 py-2"
                  title={solicitud.assignedTo ?? undefined}
                >
                  {solicitud.assignedTo ?? "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(solicitud.fechaInicio, solicitud.fechaInicioHora)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(solicitud.fechaFin, solicitud.fechaFinHora)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(solicitud.fechaReintegro, solicitud.fechaReintegroHora)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatHours(solicitud.hours)}</td>
                <td className="min-w-32 px-3 py-2 text-right">
                  {solicitud.state ? <WorkItemStateBadge state={solicitud.state} /> : "—"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
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
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                <a
                  href={solicitud.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                  title={`Abrir novedad #${solicitud.id} en Azure DevOps`}
                >
                  #{solicitud.id}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AzureLink({ solicitud }: Readonly<{ solicitud: SolicitudDto }>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={solicitud.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center"
            aria-label={`Abrir novedad #${solicitud.id} en Azure DevOps`}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        }
      />
      <TooltipContent>Abrir novedad #{solicitud.id} en Azure DevOps</TooltipContent>
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
