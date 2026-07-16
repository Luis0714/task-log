"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveFieldCellLayout, type SolicitudField } from "@/lib/solicitudes/solicitud-fields";

export type SolicitudFieldCellProps = Readonly<{
  field: SolicitudField;
  value: string;
}>;

/** Celda desktop de un campo del listado (uso interno en `SolicitudesTable`). */
export function SolicitudFieldCell({ field, value }: SolicitudFieldCellProps) {
  const { widthClass, align, withTooltip } = resolveFieldCellLayout(field);

  const baseAlign = align === "right" ? "text-right" : "text-left";
  const nowrapClass = align === "right" ? "whitespace-nowrap" : "whitespace-nowrap";
  const classes = ["px-3 py-2", baseAlign, nowrapClass, widthClass].filter(Boolean).join(" ");

  if (withTooltip) {
    return (
      <td className={classes}>
        <Tooltip>
          <TooltipTrigger render={<span className="block cursor-default truncate" />}>
            {value}
          </TooltipTrigger>
          <TooltipContent>{value}</TooltipContent>
        </Tooltip>
      </td>
    );
  }

  return <td className={classes}>{value}</td>;
}
