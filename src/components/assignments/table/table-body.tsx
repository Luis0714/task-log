"use client";

import type { AssignmentRow } from "@/hooks/assignments/use-assignments";

import { AssignmentRowDesktop } from "./assignment-row-desktop";
import { AssignmentRowMobile } from "./assignment-row-mobile";
import { DefaultRowDesktop } from "./default-row-desktop";
import { DefaultRowMobile } from "./default-row-mobile";
import type { AssignmentsTableProps, InferredDefaultRow } from "./types";

type TableBodyProps = Readonly<{
  rows: AssignmentRow[];
  defaults: InferredDefaultRow[];
  onEdit: (row: AssignmentRow) => void;
  onDefaultCreate: (row: InferredDefaultRow) => void;
  onDelete: AssignmentsTableProps["onDelete"];
}>;

export function TableBody({
  rows,
  defaults,
  onEdit,
  onDefaultCreate,
  onDelete,
}: TableBodyProps) {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Persona</th>
              <th className="px-3 py-2 text-left font-medium">Proyecto</th>
              <th className="px-3 py-2 text-left font-medium">Equipo</th>
              <th className="px-3 py-2 text-right font-medium">%</th>
              <th className="px-3 py-2 text-left font-medium">Inicio</th>
              <th className="px-3 py-2 text-left font-medium">Fin</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <AssignmentRowDesktop
                key={row.id}
                row={row}
                onEdit={() => onEdit(row)}
                onDelete={() => onDelete(row)}
              />
            ))}
            {defaults.map((row) => (
              <DefaultRowDesktop
                key={row.defaultKey}
                row={row}
                onCreate={() => onDefaultCreate(row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <AssignmentRowMobile
            key={row.id}
            row={row}
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
          />
        ))}
        {defaults.map((row) => (
          <DefaultRowMobile
            key={row.defaultKey}
            row={row}
            onCreate={() => onDefaultCreate(row)}
          />
        ))}
      </ul>
    </div>
  );
}
