"use client";

import { useState } from "react";

import { AssignmentEditDialog } from "@/components/assignments/assignment-edit-dialog";
import { DefaultCreateDialog } from "@/components/assignments/default-create-dialog";
import type { AssignmentRow } from "@/hooks/assignments/use-assignments";

import { TableBody } from "./table/table-body";
import { TableSkeleton } from "./table/table-skeleton";
import type { AssignmentsTableProps, InferredDefaultRow } from "./table/types";

export { defaultKeyOf } from "./table/types";
export type {
  AssignmentsTableProps,
  EditableRowRef,
  InferredDefaultRow,
  OpResult,
  ProjectOption,
  TeamOption,
} from "./table/types";

export function AssignmentsTable({
  rows,
  defaults = [],
  pendingDefaults = false,
  projectOptions,
  teamOptions,
  onCellChange,
  onDefaultCreate,
  onDelete,
}: AssignmentsTableProps) {
  const [editTarget, setEditTarget] = useState<AssignmentRow | null>(null);
  const [createTarget, setCreateTarget] = useState<InferredDefaultRow | null>(
    null,
  );

  const showLoadingPlaceholder = pendingDefaults;

  const isEmpty =
    !showLoadingPlaceholder && rows.length === 0 && defaults.length === 0;

  if (isEmpty) {
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
          onOpenChange={(next) => {
            if (!next) setEditTarget(null);
          }}
          assignment={editTarget}
          projectOptions={projectOptions}
          teamOptions={teamOptions}
          onSubmit={async (id, patch) => {
            const result = await onCellChange({ kind: "assignment", id }, patch);
            if (result.ok) setEditTarget(null);
            return result.ok;
          }}
        />
      ) : null}
      {createTarget ? (
        <DefaultCreateDialog
          open
          onOpenChange={(next) => {
            if (!next) setCreateTarget(null);
          }}
          defaultRow={createTarget}
          projectOptions={projectOptions}
          teamOptions={teamOptions}
          onSubmit={async (row, payload) => {
            const result = await onDefaultCreate(row, payload);
            if (result.ok) setCreateTarget(null);
            return result.ok;
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
          onDefaultCreate={setCreateTarget}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
