"use client";

import { useCallback, useState } from "react";

import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import {
  changeAssignment,
  closeAssignment,
  createAssignment,
  type ChangeAssignmentPayload,
  type CloseAssignmentPayload,
  type CreateAssignmentPayload,
} from "@/services/assignments/assignments.service";

export type AssignmentRow = AssignmentDto & { pending?: boolean };

export type UseAssignmentsResult = {
  rows: AssignmentRow[];
  createRow: (
    input: CreateAssignmentPayload,
  ) => Promise<AssignmentDto[] | null>;
  changeRow: (id: string, input: ChangeAssignmentPayload) => Promise<AssignmentDto | null>;
  closeRow: (id: string, input: CloseAssignmentPayload) => Promise<AssignmentDto | null>;
};

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
    async (input: CreateAssignmentPayload) => {
      try {
        const result = await createAssignment(input);
        upsertRows(result.assignments);
        return result.assignments;
      } catch {
        return null;
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

  return { rows, createRow, changeRow, closeRow };
}
