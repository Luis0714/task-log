"use client";

import { Loader2, Pencil, Trash2, X } from "lucide-react";

import type { AssignmentRow } from "@/hooks/assignments/use-assignments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AssignmentsTableProps = {
  rows: AssignmentRow[];
  /** Mapa id → valor del input de %. Una fila está en edición si su id es clave. */
  editing: Record<string, string>;
  onToggleEdit: (row: AssignmentRow) => void;
  onEditValueChange: (id: string, value: string) => void;
  onClose: (row: AssignmentRow) => void;
  onDelete: (row: AssignmentRow) => void;
};

/** El % de asignación solo admite enteros entre 1 y 100. */
export function isPctValueValid(value: string): boolean {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 100;
}

const dayMonthFmt = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const yearFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  timeZone: "UTC",
});

function shortDate(value: string | Date): string | null {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  const out = dayMonthFmt.format(d).replace(".", "");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function fmtVigencia(row: AssignmentRow): string {
  const fromShort = shortDate(row.validFrom);
  if (!fromShort) return String(row.validFrom);
  if (!row.validTo) return `${fromShort} -`;
  const toShort = shortDate(row.validTo);
  if (!toShort) return String(row.validTo);
  const fromYear = Number(yearFmt.format(new Date(row.validFrom)));
  const toDate = new Date(row.validTo);
  const toYear = Number(yearFmt.format(toDate));
  if (fromYear === toYear) {
    return `${fromShort} - ${toShort}`;
  }
  return `${fromShort} - ${toShort} ${toYear}`;
}

export function AssignmentsTable({
  rows,
  editing,
  onToggleEdit,
  onEditValueChange,
  onClose,
  onDelete,
}: AssignmentsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
        No hay asignaciones que coincidan con los filtros.
      </div>
    );
  }

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
              <th className="px-3 py-2 text-left font-medium">Vigencia</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = Object.hasOwn(editing, row.id);
              const editValue = editing[row.id] ?? "";
              const invalid = isEditing && !isPctValueValid(editValue);
              const editLabel = isEditing
                ? "Cancelar edición"
                : "Editar porcentaje";
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-border/40 border-t transition-opacity",
                    row.pending && "opacity-60",
                  )}
                >
                  <td className="px-3 py-2 font-medium">
                    <span className="flex items-center gap-2">
                      {row.personDisplayName}
                      {row.pending ? (
                        <Loader2
                          className="text-muted-foreground size-3 animate-spin"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {row.projectName}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {row.teamName ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100}
                          step={1}
                          value={editValue}
                          onChange={(e) =>
                            onEditValueChange(row.id, e.target.value)
                          }
                          aria-invalid={invalid}
                          aria-label={`Porcentaje de ${row.personDisplayName}`}
                          disabled={row.pending}
                          className="h-8 w-16 text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    ) : (
                      `${row.assignmentPct}%`
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs whitespace-nowrap">
                    {fmtVigencia(row)}
                  </td>
                  <td className="px-3 py-2">
                    <AssignmentStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={editLabel}
                              aria-pressed={isEditing}
                              onClick={() => onToggleEdit(row)}
                              disabled={row.pending}
                              className={cn(
                                isEditing && "text-primary bg-primary/10",
                              )}
                            />
                          }
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>{editLabel}</TooltipContent>
                      </Tooltip>
                      {row.status === "vigente" ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Cerrar vigencia"
                                onClick={() => onClose(row)}
                                disabled={row.pending}
                              />
                            }
                          >
                            <X className="size-3.5" aria-hidden />
                          </TooltipTrigger>
                          <TooltipContent>Cerrar vigencia</TooltipContent>
                        </Tooltip>
                      ) : null}
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Eliminar asignación"
                              onClick={() => onDelete(row)}
                              disabled={row.pending}
                              className="text-muted-foreground hover:text-destructive"
                            />
                          }
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>Eliminar asignación</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => {
          const isEditing = Object.hasOwn(editing, row.id);
          const editValue = editing[row.id] ?? "";
          const invalid = isEditing && !isPctValueValid(editValue);
          return (
            <li
              key={row.id}
              className={cn(
                "rounded-lg border bg-card p-3 transition-opacity",
                row.pending && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {row.personDisplayName}
                    </span>
                    {row.pending ? (
                      <Loader2
                        className="text-muted-foreground size-3 animate-spin"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {row.projectName}
                    {row.teamName ? ` · ${row.teamName}` : ""}
                  </p>
                </div>
                <AssignmentStatusBadge status={row.status} />
              </div>
              <dl className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>
                  <dt className="font-medium">%</dt>
                  <dd className="text-foreground font-mono">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100}
                          step={1}
                          value={editValue}
                          onChange={(e) =>
                            onEditValueChange(row.id, e.target.value)
                          }
                          aria-invalid={invalid}
                          aria-label={`Porcentaje de ${row.personDisplayName}`}
                          disabled={row.pending}
                          className="h-8 w-16"
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      `${row.assignmentPct}%`
                    )}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-medium">Vigencia</dt>
                  <dd className="text-foreground">{fmtVigencia(row)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap justify-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleEdit(row)}
                  disabled={row.pending}
                  className={cn(isEditing && "text-primary border-primary")}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
                {row.status === "vigente" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onClose(row)}
                    disabled={row.pending}
                  >
                    <X className="size-3.5" aria-hidden />
                    Cerrar
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(row)}
                  disabled={row.pending}
                  className="text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Eliminar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AssignmentStatusBadge({ status }: { status: "vigente" | "historica" }) {
  if (status === "vigente") {
    return (
      <Badge className="bg-primary/10 text-primary border-transparent">
        Vigente
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="border-transparent">
      Histórica
    </Badge>
  );
}
