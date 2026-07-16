"use client";

import { SOLICITUD_FIELDS } from "@/lib/solicitudes/solicitud-fields";

export type SolicitudesTableHeaderProps = Readonly<Record<never, never>>;

/** Encabezado fijo de la tabla desktop "Mis solicitudes". */
export function SolicitudesTableHeader(_: SolicitudesTableHeaderProps) {
  return (
    <tr>
      {SOLICITUD_FIELDS.map((field) => (
        <th
          key={field.key}
          className={[
            "px-3 py-2 font-medium",
            field.align === "right" ? "text-right" : "text-left",
          ].join(" ")}
        >
          {field.label}
        </th>
      ))}
      <th className="px-3 py-2 text-right font-medium">Estado</th>
      <th className="px-3 py-2 text-right font-medium">Acciones</th>
      <th className="px-3 py-2 text-right font-medium">Azure</th>
    </tr>
  );
}
