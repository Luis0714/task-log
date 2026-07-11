"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AssignmentEditDialog,
} from "@/components/assignments/assignment-edit-dialog";
import {
  DefaultCreateDialog,
} from "@/components/assignments/default-create-dialog";
import {
  ConfirmEditDialog,
  type ConfirmEditDialogProps,
} from "@/components/assignments/confirm-edit-dialog";
import type { AssignmentRow } from "@/hooks/assignments/use-assignments";
import type { EditAssignmentPayload } from "@/services/assignments/assignments.service";
import { cn } from "@/lib/utils";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";

export type ProjectOption = { value: string; label: string; teams: TeamOption[] };
export type TeamOption = { value: string; label: string };

export type OpResult = Promise<{ ok: boolean; message?: string }>;

export type AssignmentsTableProps = {
  rows: AssignmentRow[];
  /** Filas virtuales por defecto (personas sin excepción). */
  defaults?: InferredDefaultRow[];
  /** Mientras la inferencia de filas "por defecto" está en vuelo. */
  pendingDefaults?: boolean;
  /** Catálogo de proyectos y equipos para alimentar los diálogos. */
  projectOptions: MultiCheckboxFilterOption[];
  teamOptions: MultiCheckboxFilterOption[];
  /** Llamado al confirmar un cambio de celda. */
  onCellChange: (
    row: EditableRowRef,
    patch: EditAssignmentPayload,
  ) => OpResult;
  /** Llamado al confirmar la creación desde una fila "por defecto". */
  onDefaultCreate: (
    row: InferredDefaultRow,
    payload: EditAssignmentPayload,
  ) => OpResult;
  /** Llamado al confirmar el cierre de vigencia (manual). */
  onCloseVigencia: (row: AssignmentRow, validTo: string) => OpResult;
  /** Llamado al confirmar el borrado. */
  onDelete: (row: AssignmentRow) => OpResult;
};

export type EditableRowRef =
  | { kind: "assignment"; id: string }
  | { kind: "default"; defaultKey: string };

export type InferredDefaultRow = {
  defaultKey: string;
  personAdoId: string;
  personDisplayName: string;
  projectId: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
};

/** Genera la clave estable para una fila "por defecto". */
export function defaultKeyOf(d: Omit<InferredDefaultRow, "defaultKey">): string {
  return [d.personAdoId, d.projectId, d.teamId ?? "_"].join("::");
}

export function AssignmentsTable({
  rows,
  defaults = [],
  pendingDefaults = false,
  projectOptions,
  teamOptions,
  onCellChange,
  onDefaultCreate,
  onCloseVigencia,
  onDelete,
}: AssignmentsTableProps) {
  const [editTarget, setEditTarget] = useState<AssignmentRow | null>(null);
  const [createTarget, setCreateTarget] = useState<InferredDefaultRow | null>(
    null,
  );

  const showLoadingPlaceholder =
    pendingDefaults && rows.length === 0 && defaults.length === 0;

  if (!showLoadingPlaceholder && rows.length === 0 && defaults.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
        No hay asignaciones que coincidan con los filtros.
      </div>
    );
  }

  return (
    <>
      {editTarget ? (
        <AssignmentEditDialog
          open
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
          }}
          assignment={editTarget}
          projectOptions={projectOptions}
          teamOptions={teamOptions}
          onSubmit={async (id, patch) => {
            const r = await onCellChange({ kind: "assignment", id }, patch);
            if (r.ok) setEditTarget(null);
            return r.ok;
          }}
        />
      ) : null}
      {createTarget ? (
        <DefaultCreateDialog
          open
          onOpenChange={(o) => {
            if (!o) setCreateTarget(null);
          }}
          defaultRow={createTarget}
          projectOptions={projectOptions}
          teamOptions={teamOptions}
          onSubmit={async (row, payload) => {
            const r = await onDefaultCreate(row, payload);
            if (r.ok) setCreateTarget(null);
            return r.ok;
          }}
        />
      ) : null}
      {showLoadingPlaceholder ? (
        <TableSkeleton />
      ) : (
        <TableBody
          rows={rows}
          defaults={defaults}
          onEdit={setEditTarget}
          onCellChange={onCellChange}
          onDefaultCreate={(row) => {
            setCreateTarget(row);
          }}
          onCloseVigencia={onCloseVigencia}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

/**
 * Placeholder mostrado mientras se resuelve la inferencia de filas "por
 * defecto". Mantiene la estructura visual de la tabla pero sin contenido.
 */
function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="bg-muted/40 flex border-b px-3 py-2">
        <div className="grid w-full grid-cols-7 gap-3 text-xs">
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton key={`hdr-${idx}`} className="h-3 w-24" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`row-${idx}`}
            className="grid grid-cols-7 items-center gap-3 px-3 py-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableBody({
  rows,
  defaults,
  onEdit,
  onCellChange,
  onDefaultCreate,
  onCloseVigencia,
  onDelete,
}: {
  rows: AssignmentRow[];
  defaults: InferredDefaultRow[];
  onEdit: (row: AssignmentRow) => void;
  onCellChange: AssignmentsTableProps["onCellChange"];
  onDefaultCreate: (row: InferredDefaultRow) => void;
  onCloseVigencia: AssignmentsTableProps["onCloseVigencia"];
  onDelete: AssignmentsTableProps["onDelete"];
}) {
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
                onCellChange={(patch) =>
                  onCellChange({ kind: "assignment", id: row.id }, patch)
                }
                onCloseVigencia={(validTo) => onCloseVigencia(row, validTo)}
                onDelete={() => onDelete(row)}
              />
            ))}
            {defaults.map((d) => (
              <DefaultRowDesktop
                key={d.defaultKey}
                row={d}
                onCreate={() => onDefaultCreate(d)}
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
            onCloseVigencia={(validTo) => onCloseVigencia(row, validTo)}
            onDelete={() => onDelete(row)}
          />
        ))}
        {defaults.map((d) => (
          <DefaultRowMobile
            key={d.defaultKey}
            row={d}
            onCreate={() => onDefaultCreate(d)}
          />
        ))}
      </ul>
    </div>
  );
}

type PendingPatch = {
  patch: EditAssignmentPayload;
  confirmTitle: string;
  confirmDescription: string;
};

function AssignmentRowDesktop({
  row,
  onEdit,
  onCellChange,
  onCloseVigencia,
  onDelete,
}: {
  row: AssignmentRow;
  onEdit: () => void;
  onCellChange: (
    patch: EditAssignmentPayload,
  ) => Promise<{ ok: boolean; message?: string }>;
  onCloseVigencia: (validTo: string) => Promise<{ ok: boolean; message?: string }>;
  onDelete: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const [pending, setPending] = useState<PendingPatch | null>(null);

  const isOpen = !row.validTo;

  return (
    <>
      <tr
        className={cn(
          "border-border/40 border-t transition-opacity",
          row.pending && "opacity-60",
        )}
      >
        <td className="px-3 py-2 font-medium">
          <div className="flex items-center gap-2">
            {row.personDisplayName}
            {row.pending ? (
              <Loader2
                className="text-muted-foreground size-3 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {row.projectName}
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {row.teamName ?? "—"}
        </td>
        <td className="px-3 py-2 text-right font-mono">{row.assignmentPct}%</td>
        <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
          {row.validFrom.slice(0, 10)}
        </td>
        <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
          {row.validTo ? row.validTo.slice(0, 10) : "—"}
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
                    aria-label="Editar asignación"
                    onClick={onEdit}
                    disabled={row.pending}
                  />
                }
              >
                <Pencil className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            {isOpen ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Cerrar vigencia"
                      onClick={() =>
                        setPending({
                          patch: { validTo: todayKey() },
                          confirmTitle: "Cerrar vigencia",
                          confirmDescription:
                            "La persona dejará de generar horas esperadas en este proyecto a partir de hoy.",
                        })
                      }
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
                    onClick={() =>
                      setPending({
                        patch: {},
                        confirmTitle: "Eliminar asignación",
                        confirmDescription:
                          "Esta acción no se puede deshacer. La fila volverá a su estado por defecto (100% en el equipo del usuario).",
                      })
                    }
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
      {pending ? (
        <PendingConfirmDialog
          pending={pending}
          onCellChange={(patch) => onCellChange(patch)}
          onCloseVigencia={onCloseVigencia}
          onDelete={onDelete}
          onClose={() => setPending(null)}
        />
      ) : null}
    </>
  );
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCloseOnlyPatch(p: EditAssignmentPayload): boolean {
  return (
    !p.projectId &&
    !p.teamId &&
    !p.roleId &&
    typeof p.assignmentPct !== "number" &&
    !p.validFrom &&
    typeof p.validTo === "string"
  );
}

function isDeletePatch(p: EditAssignmentPayload): boolean {
  return Object.keys(p).length === 0;
}

function PendingConfirmDialog({
  pending,
  onCellChange,
  onCloseVigencia,
  onDelete,
  onClose,
}: {
  pending: PendingPatch;
  onCellChange: (
    patch: EditAssignmentPayload,
  ) => Promise<{ ok: boolean; message?: string }>;
  onCloseVigencia: (validTo: string) => Promise<{ ok: boolean; message?: string }>;
  onDelete: () => Promise<{ ok: boolean; message?: string }>;
  onClose: () => void;
}) {
  let confirmProps: Pick<
    ConfirmEditDialogProps,
    "title" | "description" | "confirmLabel" | "onConfirm"
  >;
  if (isDeletePatch(pending.patch)) {
    confirmProps = {
      title: pending.confirmTitle,
      description: pending.confirmDescription,
      confirmLabel: "Eliminar",
      onConfirm: async () => (await onDelete()).ok,
    };
  } else if (isCloseOnlyPatch(pending.patch)) {
    const validTo = pending.patch.validTo ?? todayKey();
    confirmProps = {
      title: pending.confirmTitle,
      description: pending.confirmDescription,
      confirmLabel: "Cerrar vigencia",
      onConfirm: async () => (await onCloseVigencia(validTo)).ok,
    };
  } else {
    confirmProps = {
      title: pending.confirmTitle,
      description: pending.confirmDescription,
      confirmLabel: "Guardar cambios",
      onConfirm: async () => (await onCellChange(pending.patch)).ok,
    };
  }

  return (
    <ConfirmEditDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      {...confirmProps}
    />
  );
}

function DefaultRowDesktop({
  row,
  onCreate,
}: {
  row: InferredDefaultRow;
  onCreate: () => void;
}) {
  return (
    <tr className="border-border/40 border-t">
      <td className="px-3 py-2 font-medium">{row.personDisplayName}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.projectName}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.teamName ?? "—"}</td>
      <td className="px-3 py-2 text-right font-mono">100%</td>
      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
        {todayKey()}
      </td>
      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
        —
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
                  aria-label="Crear asignación"
                  onClick={onCreate}
                />
              }
            >
              <Plus className="size-3.5" aria-hidden />
            </TooltipTrigger>
            <TooltipContent>Crear asignación</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function AssignmentRowMobile(props: {
  row: AssignmentRow;
  onEdit: () => void;
  onCloseVigencia: (
    validTo: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDelete: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const [confirmClose, setConfirmClose] = useState<{ validTo: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOpen = !props.row.validTo;

  return (
    <li
      className={cn(
        "rounded-lg border bg-card p-3 transition-opacity",
        props.row.pending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">
              {props.row.personDisplayName}
            </span>
            {props.row.pending ? (
              <Loader2
                className="text-muted-foreground size-3 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {props.row.projectName}
            {props.row.teamName ? ` · ${props.row.teamName}` : ""}
          </p>
        </div>
        <span className="font-mono text-sm">{props.row.assignmentPct}%</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {props.row.validFrom.slice(0, 10)}
        {props.row.validTo ? ` → ${props.row.validTo.slice(0, 10)}` : " →"}
      </p>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={props.onEdit}
          disabled={props.row.pending}
        >
          Editar
        </Button>
        {isOpen ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmClose({ validTo: todayKey() })}
            disabled={props.row.pending}
          >
            Cerrar
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setConfirmDelete(true)}
          disabled={props.row.pending}
          className="text-destructive"
        >
          Eliminar
        </Button>
      </div>
      {confirmClose ? (
        <ConfirmEditDialog
          open
          onOpenChange={(o) => {
            if (!o) setConfirmClose(null);
          }}
          title="Cerrar vigencia"
          description={`${props.row.personDisplayName} dejará de generar horas esperadas en ${props.row.projectName} a partir de hoy.`}
          confirmLabel="Cerrar vigencia"
          onConfirm={async () => {
            const r = await props.onCloseVigencia(confirmClose.validTo);
            if (r.ok) setConfirmClose(null);
            return r.ok;
          }}
        />
      ) : null}
      {confirmDelete ? (
        <ConfirmEditDialog
          open
          onOpenChange={(o) => {
            if (!o) setConfirmDelete(false);
          }}
          title="Eliminar asignación"
          description="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={async () => {
            const r = await props.onDelete();
            if (r.ok) setConfirmDelete(false);
            return r.ok;
          }}
        />
      ) : null}
    </li>
  );
}

function DefaultRowMobile(props: {
  row: InferredDefaultRow;
  onCreate: () => void;
}) {
  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">
              {props.row.personDisplayName}
            </span>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {props.row.projectName}
            {props.row.teamName ? ` · ${props.row.teamName}` : ""}
          </p>
        </div>
        <span className="font-mono text-sm">100%</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{todayKey()} →</p>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={props.onCreate}
        >
          Crear
        </Button>
      </div>
    </li>
  );
}

