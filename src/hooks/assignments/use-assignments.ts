"use client";

import { useCallback, useState } from "react";

import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import {
  changeAssignment,
  closeAssignment,
  createAssignment,
  deleteAssignment,
  editAssignment,
  type ChangeAssignmentPayload,
  type CloseAssignmentPayload,
  type CreateAssignmentPayload,
  type EditAssignmentPayload,
} from "@/services/assignments/assignments.service";

export type AssignmentRow = AssignmentDto & { pending?: boolean };

export type CreateRowResult =
  | { ok: true; assignments: AssignmentDto[] }
  | { ok: false; message: string };

export type UpdateCellResult =
  | { ok: true; assignment: AssignmentDto }
  | { ok: false; message: string };

export type UseAssignmentsResult = {
  rows: AssignmentRow[];
  createRow: (input: CreateAssignmentPayload) => Promise<CreateRowResult>;
  changeRow: (
    id: string,
    input: ChangeAssignmentPayload,
  ) => Promise<AssignmentDto | null>;
  closeRow: (
    id: string,
    input: CloseAssignmentPayload,
  ) => Promise<AssignmentDto | null>;
  editCell: (
    id: string,
    patch: EditAssignmentPayload,
  ) => Promise<UpdateCellResult>;
  deleteRow: (id: string) => Promise<boolean>;
};

const FALLBACK_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message.trim() ? err.message : FALLBACK_ERROR;
}

function sortRows(list: AssignmentRow[]): AssignmentRow[] {
  return [...list].sort((a, b) => {
    // Vigentes primero.
    const aOpen = !a.validTo;
    const bOpen = !b.validTo;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    const personA = a.personDisplayName ?? "";
    const personB = b.personDisplayName ?? "";
    const byPerson = personA.localeCompare(personB, "es", {
      sensitivity: "base",
    });
    if (byPerson !== 0) return byPerson;
    return b.validFrom.localeCompare(a.validFrom);
  });
}

function upsertOne(
  prev: AssignmentRow[],
  next: AssignmentDto,
): AssignmentRow[] {
  const idx = prev.findIndex((r) => r.id === next.id);
  const merged = { ...next, pending: false };
  const list = idx >= 0
    ? prev.map((r, i) => (i === idx ? merged : r))
    : [...prev, merged];
  return sortRows(list);
}

export function useAssignments(initial: AssignmentDto[]): UseAssignmentsResult {
  const [rows, setRows] = useState<AssignmentRow[]>(sortRows(initial));

  const createRow = useCallback(
    async (input: CreateAssignmentPayload): Promise<CreateRowResult> => {
      try {
        const result = await createAssignment(input);
        const created = result.assignments;
        if (created.length > 0) {
          setRows((prev) => sortRows([...prev, ...created.map((d) => ({ ...d, pending: false }))]));
        }
        return { ok: true, assignments: created };
      } catch (err) {
        return { ok: false, message: errorMessage(err) };
      }
    },
    [],
  );

  const changeRow = useCallback(
    async (id: string, input: ChangeAssignmentPayload) => {
      const exists = rows.some((r) => r.id === id);
      if (!exists) return null;
      try {
        const updated = await changeAssignment(id, input);
        setRows((prev) => upsertOne(prev, updated));
        return updated;
      } catch {
        return null;
      }
    },
    [rows],
  );

  const closeRow = useCallback(
    async (id: string, input: CloseAssignmentPayload) => {
      const exists = rows.some((r) => r.id === id);
      if (!exists) return null;
      try {
        const updated = await closeAssignment(id, input);
        setRows((prev) => upsertOne(prev, updated));
        return updated;
      } catch {
        return null;
      }
    },
    [rows],
  );

  const editCell = useCallback(
    async (
      id: string,
      patch: EditAssignmentPayload,
    ): Promise<UpdateCellResult> => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) return { ok: false, message: "La asignación ya no existe." };
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, pending: true } : r)),
      );
      try {
        const updated = await editAssignment(id, patch);
        setRows((prev) => upsertOne(prev, updated));
        return { ok: true, assignment: updated };
      } catch (err) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, pending: snapshot.pending ?? false } : r,
          ),
        );
        return { ok: false, message: errorMessage(err) };
      }
    },
    [rows],
  );

  const deleteRow = useCallback(
    async (id: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, pending: true } : r)),
      );
      try {
        await deleteAssignment(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, pending: false } : r)),
        );
        return false;
      }
    },
    [],
  );

  return {
    rows,
    createRow,
    changeRow,
    closeRow,
    editCell,
    deleteRow,
  };
}
