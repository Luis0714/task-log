"use client";

import { useCallback } from "react";

import {
  type InferredDefaultRow,
  type OpResult,
} from "@/components/assignments/assignments-table";
import type {
  AssignmentRow,
  CreateRowResult,
  UpdateCellResult,
} from "@/hooks/assignments/use-assignments";
import type {
  CreateAssignmentPayload,
  EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import { appToast } from "@/lib/toast";

export type UseAssignmentActionsDeps = {
  createRow: (input: CreateAssignmentPayload) => Promise<CreateRowResult>;
  editCell: (id: string, patch: EditAssignmentPayload) => Promise<UpdateCellResult>;
  deleteRow: (id: string) => Promise<boolean>;
  /** Quita la fila "por defecto" ya materializada como asignación real. */
  removeDefault: (defaultKey: string) => void;
};

export type UseAssignmentActionsResult = {
  handleCellChange: (id: string, patch: EditAssignmentPayload) => OpResult;
  handleDelete: (row: AssignmentRow) => OpResult;
  handleDefaultCreate: (
    row: InferredDefaultRow,
    payload: EditAssignmentPayload,
  ) => OpResult;
};

/**
 * Orquesta las operaciones de la tabla de asignaciones (editar, eliminar y
 * materializar una fila "por defecto") con feedback de toast. Separa la lógica
 * de acción del render del shell.
 */
export function useAssignmentActions({
  createRow,
  editCell,
  deleteRow,
  removeDefault,
}: UseAssignmentActionsDeps): UseAssignmentActionsResult {
  const handleCellChange = useCallback(
    async (id: string, patch: EditAssignmentPayload) => {
      if (Object.keys(patch).length === 0) return { ok: true };
      const res = await editCell(id, patch);
      if (!res.ok) {
        appToast.error(res.message);
        return { ok: false, message: res.message };
      }
      appToast.success("Asignación actualizada.");
      return { ok: true };
    },
    [editCell],
  );

  const handleDelete = useCallback(
    async (row: AssignmentRow) => {
      const ok = await deleteRow(row.id);
      if (!ok) {
        const message = "No se pudo eliminar la asignación.";
        appToast.error(message);
        return { ok: false, message };
      }
      appToast.success("Asignación eliminada.");
      return { ok: true };
    },
    [deleteRow],
  );

  const handleDefaultCreate = useCallback(
    async (defaultRow: InferredDefaultRow, payload: EditAssignmentPayload) => {
      // Vía `createRow` (del hook) para que la nueva asignación quede en
      // `rows` de inmediato; si no, la fila "por defecto" desaparece pero la
      // real no aparecería hasta recargar.
      const result = await createRow({
        personAdoId: defaultRow.personAdoId,
        personDisplayName: defaultRow.personDisplayName,
        projectId: payload.projectId ?? defaultRow.projectId,
        projectName: payload.projectName ?? defaultRow.projectName,
        teamId: payload.teamId ?? null,
        teamName: payload.teamName ?? null,
        roleId: payload.roleId ?? null,
        assignmentPct: payload.assignmentPct ?? 100,
        validFrom: payload.validFrom ?? getTodayDateKey(),
        validTo: payload.validTo ?? undefined,
      });
      if (!result.ok) {
        appToast.error(result.message);
        return { ok: false, message: result.message };
      }
      appToast.success("Asignación creada.");
      removeDefault(defaultRow.defaultKey);
      return { ok: true };
    },
    [createRow, removeDefault],
  );

  return { handleCellChange, handleDelete, handleDefaultCreate };
}