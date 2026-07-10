"use client";

import { useCallback, useState } from "react";

import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import {
  changeAssignment,
  closeAssignment,
  createAssignment,
  deleteAssignment,
  updateAssignmentPct,
  type ChangeAssignmentPayload,
  type CloseAssignmentPayload,
  type CreateAssignmentPayload,
} from "@/services/assignments/assignments.service";

export type AssignmentRow = AssignmentDto & { pending?: boolean };

export type CreateRowResult =
  | { ok: true; assignments: AssignmentDto[] }
  | { ok: false; message: string };

export type UpdatePctResult =
  | { ok: true; assignment: AssignmentDto }
  | { ok: false; message: string };

export type UseAssignmentsResult = {
  rows: AssignmentRow[];
  createRow: (input: CreateAssignmentPayload) => Promise<CreateRowResult>;
  changeRow: (id: string, input: ChangeAssignmentPayload) => Promise<AssignmentDto | null>;
  closeRow: (id: string, input: CloseAssignmentPayload) => Promise<AssignmentDto | null>;
  updatePctRow: (id: string, assignmentPct: number) => Promise<UpdatePctResult>;
  deleteRow: (id: string) => Promise<boolean>;
};

const FALLBACK_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message.trim() ? err.message : FALLBACK_ERROR;
}

export type AssignmentMutationError = Error & {
  code?: string;
  currentTotal?: number | null;
  conflictingPct?: number | null;
};

function sortRows(list: AssignmentRow[]): AssignmentRow[] {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "vigente" ? -1 : 1;
    }
    const personA = a.personDisplayName ?? "";
    const personB = b.personDisplayName ?? "";
    const byPerson = personA.localeCompare(personB, "es", { sensitivity: "base" });
    if (byPerson !== 0) return byPerson;
    return b.validFrom.localeCompare(a.validFrom);
  });
}

function mergeRows(prev: AssignmentRow[], next: AssignmentDto[]): AssignmentRow[] {
  if (next.length === 0) return prev;
  const nextIds = new Set(next.map((d) => d.id));
  const filtered = prev.filter((r) => !nextIds.has(r.id));
  return sortRows([...filtered, ...next.map((d) => ({ ...d, pending: false }))]);
}

export function useAssignments(initial: AssignmentDto[]): UseAssignmentsResult {
  const [rows, setRows] = useState<AssignmentRow[]>(sortRows(initial));

  const replaceRow = useCallback((updated: AssignmentDto) => {
    setRows((prev) =>
      sortRows(
        prev.map((r) => (r.id === updated.id ? { ...updated, pending: false } : r)),
      ),
    );
  }, []);

  const markPending = useCallback((id: string, pending: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, pending } : r)),
    );
  }, []);

  const upsertRow = useCallback((dto: AssignmentDto) => {
    setRows((prev) => mergeRows(prev, [dto]));
  }, []);

  const upsertRows = useCallback((dtos: AssignmentDto[]) => {
    setRows((prev) => mergeRows(prev, dtos));
  }, []);

  const createRow = useCallback(
    async (input: CreateAssignmentPayload): Promise<CreateRowResult> => {
      try {
        const result = await createAssignment(input);
        upsertRows(result.assignments);
        return { ok: true, assignments: result.assignments };
      } catch (err) {
        return { ok: false, message: errorMessage(err) };
      }
    },
    [upsertRows],
  );

  const changeRow = useCallback(
    async (id: string, input: ChangeAssignmentPayload) => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) return null;
      markPending(id, true);
      try {
        const updated = await changeAssignment(id, input);
        upsertRow(updated);
        return updated;
      } catch (_err) {
        markPending(snapshot.id, false);
        return null;
      } finally {
        markPending(id, false);
      }
    },
    [markPending, rows, upsertRow],
  );

  const closeRow = useCallback(
    async (id: string, input: CloseAssignmentPayload) => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) return null;
      markPending(id, true);
      try {
        const updated = await closeAssignment(id, input);
        replaceRow(updated);
        return updated;
      } catch (_err) {
        markPending(snapshot.id, false);
        return null;
      } finally {
        markPending(id, false);
      }
    },
    [markPending, replaceRow, rows],
  );

  const updatePctRow = useCallback(
    async (id: string, assignmentPct: number): Promise<UpdatePctResult> => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) {
        return { ok: false, message: "La asignación ya no existe." };
      }
      markPending(id, true);
      try {
        const updated = await updateAssignmentPct(id, assignmentPct);
        replaceRow(updated);
        return { ok: true, assignment: updated };
      } catch (err) {
        markPending(snapshot.id, false);
        return { ok: false, message: errorMessage(err) };
      } finally {
        markPending(id, false);
      }
    },
    [markPending, replaceRow, rows],
  );

  const deleteRow = useCallback(
    async (id: string) => {
      markPending(id, true);
      try {
        await deleteAssignment(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch (_err) {
        markPending(id, false);
        return false;
      }
    },
    [markPending],
  );

  return { rows, createRow, changeRow, closeRow, updatePctRow, deleteRow };
}
