"use client";

import { AzureDevOpsLink } from "@/components/solicitudes/azure-devops-link";
import { SolicitudFieldCell } from "@/components/solicitudes/solicitud-field-cell";
import { SolicitudRowActions } from "@/components/solicitudes/solicitud-row-actions";
import {
  resolveSolicitudStateLabel,
  SOLICITUD_FIELDS,
} from "@/lib/solicitudes/solicitud-fields";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudTableRowItemProps = Readonly<{
  solicitud: SolicitudDto;
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
}>;

/** Fila usada en la vista desktop del listado "Mis solicitudes". */
export function SolicitudTableRowItem({
  solicitud,
  project,
  onEdit,
  onDeleted,
}: SolicitudTableRowItemProps) {
  const stateLabel = resolveSolicitudStateLabel(solicitud.state);
  const hasBadge = Boolean(solicitud.state);

  return (
    <tr className="hover:bg-muted/30">
      {SOLICITUD_FIELDS.map((field) => (
        <SolicitudFieldCell
          key={field.key}
          field={field}
          value={field.getValue(solicitud)}
        />
      ))}
      <td className="min-w-32 px-3 py-2 text-right">
        {hasBadge ? <WorkItemStateBadge state={solicitud.state ?? ""} /> : stateLabel}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <SolicitudRowActions
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
  );
}
