"use client";

import { ExternalLink } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { formatDateKeyDMY } from "@/lib/solicitudes/time-calc";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return formatDateKeyDMY(value.slice(0, 10));
}

function formatHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  return `${hours} h`;
}

export type SolicitudesTableProps = Readonly<{
  solicitudes: readonly SolicitudDto[];
}>;

export function SolicitudesTable({ solicitudes }: SolicitudesTableProps) {
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
              <Field label="Inicio" value={formatDate(solicitud.fechaInicio)} />
              <Field label="Fin" value={formatDate(solicitud.fechaFin)} />
              <Field label="Reintegro" value={formatDate(solicitud.fechaReintegro)} />
              <Field label="Horas" value={formatHours(solicitud.hours)} />
              <Field label="Estado" value={solicitud.state || "—"} />
            </dl>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla; el scroll horizontal es solo respaldo para pantallas muy angostas. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Título</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Asignado</th>
              <th className="px-3 py-2 font-medium">Inicio</th>
              <th className="px-3 py-2 font-medium">Fin</th>
              <th className="px-3 py-2 font-medium">Reintegro</th>
              <th className="px-3 py-2 text-right font-medium">Horas</th>
              <th className="px-3 py-2 text-right font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Azure</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {solicitudes.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-muted/30">
                <td className="max-w-[260px] truncate px-3 py-2" title={solicitud.title}>
                  {solicitud.title}
                </td>
                <td className="px-3 py-2">{solicitud.tipo ?? "—"}</td>
                <td className="px-3 py-2">{solicitud.assignedTo ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(solicitud.fechaInicio)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(solicitud.fechaFin)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(solicitud.fechaReintegro)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatHours(solicitud.hours)}</td>
                <td className="min-w-32 px-3 py-2 text-right">
                  {solicitud.state ? <WorkItemStateBadge state={solicitud.state} /> : "—"}
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
