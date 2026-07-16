"use client";

import { AzureDevOpsLink } from "@/components/solicitudes/azure-devops-link";
import { SolicitudFieldCardRow } from "@/components/solicitudes/solicitud-field-card-row";
import { SolicitudRowActions } from "@/components/solicitudes/solicitud-row-actions";
import {
  resolveSolicitudStateLabel,
  SOLICITUD_FIELDS,
} from "@/lib/solicitudes/solicitud-fields";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudTableCardItemProps = Readonly<{
  solicitud: SolicitudDto;
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
}>;

/** Tarjeta usada en la vista móvil del listado "Mis solicitudes". */
export function SolicitudTableCardItem({
  solicitud,
  project,
  onEdit,
  onDeleted,
}: SolicitudTableCardItemProps) {
  return (
    <li className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 font-medium wrap-break-word" title={solicitud.title}>
          {solicitud.title}
        </p>
        <AzureDevOpsLink solicitud={solicitud} variant="icon" />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {SOLICITUD_FIELDS.map((field) => (
          <SolicitudFieldCardRow
            key={field.key}
            label={field.label}
            value={field.getValue(solicitud)}
          />
        ))}
        <SolicitudFieldCardRow
          label="Estado"
          value={resolveSolicitudStateLabel(solicitud.state)}
        />
      </dl>
      <div className="mt-3 flex items-center justify-end gap-1">
        <SolicitudRowActions
          solicitud={solicitud}
          project={project}
          onEdit={onEdit}
          onDeleted={onDeleted}
        />
      </div>
    </li>
  );
}
