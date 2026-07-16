"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteSolicitudDialog } from "@/components/solicitudes/delete-solicitud-dialog";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudRowActionsProps = Readonly<{
  solicitud: SolicitudDto;
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
}>;

export function SolicitudRowActions({
  solicitud,
  project,
  onEdit,
  onDeleted,
}: SolicitudRowActionsProps) {
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
