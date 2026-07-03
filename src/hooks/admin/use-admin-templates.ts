"use client";

import { useCallback, useState } from "react";

import {
  createAdminTemplate,
  deleteAdminTemplate,
  updateAdminTemplate,
} from "@/services/admin/admin-templates.service";
import type {
  AdminCreateTimeLogTemplateBody,
  AdminUpdateTimeLogTemplateBody,
  TimeLogTemplateDto,
} from "@/lib/schemas/time-log-template";

export type AdminTemplateRow = TimeLogTemplateDto & { pending?: boolean };

export type UseAdminTemplatesResult = {
  rows: AdminTemplateRow[];
  createTemplate: (
    input: AdminCreateTimeLogTemplateBody,
  ) => Promise<TimeLogTemplateDto | null>;
  updateTemplate: (
    id: string,
    input: AdminUpdateTimeLogTemplateBody,
  ) => Promise<TimeLogTemplateDto | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
};

function sortByName(list: AdminTemplateRow[]): AdminTemplateRow[] {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
  );
}

function sortByScopeAndName(list: AdminTemplateRow[]): AdminTemplateRow[] {
  return [...list].sort((a, b) => {
    const aKey = a.seedKey ?? "";
    const bKey = b.seedKey ?? "";
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

/**
 * Hook de mutaciones para la tabla admin de plantillas. Los datos iniciales
 * se hidratan server-side (page.tsx) — el hook sólo maneja mutaciones locales
 * con optimistic updates y rollback en error (mirror del patrón de
 * `use-admin-users-table.ts`).
 */
export function useAdminTemplates(
  initialTemplates: TimeLogTemplateDto[],
): UseAdminTemplatesResult {
  const [rows, setRows] = useState<AdminTemplateRow[]>(
    sortByScopeAndName(initialTemplates),
  );

  const applyOptimistic = useCallback(
    (id: string, patch: Partial<AdminTemplateRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const revertOptimistic = useCallback(
    (id: string, snapshot: AdminTemplateRow) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...snapshot, pending: false } : r,
        ),
      );
    },
    [],
  );

  const createTemplate = useCallback(
    async (input: AdminCreateTimeLogTemplateBody) => {
      try {
        const created = await createAdminTemplate(input);
        setRows((prev) => sortByScopeAndName([...prev, created]));
        return created;
      } catch {
        return null;
      }
    },
    [],
  );

  const updateTemplate = useCallback(
    async (id: string, input: AdminUpdateTimeLogTemplateBody) => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) return null;
      applyOptimistic(id, {
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: input.defaultActivity?.trim() || null,
        isSystem: true,
        seedKey: input.scope,
        pending: true,
      });
      try {
        const updated = await updateAdminTemplate(id, input);
        applyOptimistic(id, { ...updated, pending: false });
        // Re-sort by scope/name in case the scope changed.
        setRows((prev) => sortByScopeAndName(prev));
        return updated;
      } catch {
        revertOptimistic(id, snapshot);
        return null;
      }
    },
    [applyOptimistic, revertOptimistic, rows],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      const snapshot = rows.find((r) => r.id === id);
      if (!snapshot) return false;
      applyOptimistic(id, { pending: true });
      try {
        await deleteAdminTemplate(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch {
        revertOptimistic(id, snapshot);
        return false;
      }
    },
    [applyOptimistic, revertOptimistic, rows],
  );

  return { rows, createTemplate, updateTemplate, deleteTemplate };
}

/** Utilidad de export para ordenar manualmente cuando haga falta. */
export { sortByName };
