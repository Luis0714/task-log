"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { AdoFiltersCollapsible } from "@/components/filters/ado-filters-collapsible";
import { AdoContextTeamDefaultHint } from "@/components/filters/ado-context-team-default-hint";
import { AssignmentsContextFields } from "@/components/assignments/assignments-context-fields";
import { AssignmentCloseDialog } from "@/components/assignments/assignment-close-dialog";
import { AssignmentDeleteDialog } from "@/components/assignments/assignment-delete-dialog";
import { AssignmentFormDialog } from "@/components/assignments/assignment-form-dialog";
import {
  AssignmentsFilters,
  EMPTY_ASSIGNMENTS_FILTERS,
} from "@/components/assignments/assignments-filters";
import type { AssignmentsFiltersValue } from "@/components/assignments/assignments-filters";
import {
  AssignmentsTable,
  isPctValueValid,
} from "@/components/assignments/assignments-table";
import { Button } from "@/components/ui/button";
import {
  useAssignments,
  type AssignmentRow,
} from "@/hooks/assignments/use-assignments";
import { useAssignmentsContextUrl } from "@/hooks/assignments/use-assignments-context-url";
import { useSaveAdoContextDefaults } from "@/hooks/filters/use-save-ado-context-defaults";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoFiltersSummary } from "@/lib/filters/summary";
import {
  checkOverAllocation,
  type AllocationItem,
  type MessageSegment,
} from "@/lib/assignments/over-allocation";
import { OverAllocationMessage } from "@/components/assignments/over-allocation-message";
import { monthToDateRange } from "@/lib/assignments/month-range";
import { appToast } from "@/lib/toast";
import type {
  AssignmentDefaultContext,
  CloseAssignmentPayload,
  CreateAssignmentPayload,
} from "@/services/assignments/assignments.service";
import {
  listTeamMembersByProjectAndTeam,
} from "@/services/assignments/assignments.service";

export type AssignmentsShellProps = Readonly<{
  initialAssignments: AssignmentDto[];
  catalog: AdoCatalogSnapshot;
}>;

const PLACEHOLDER_ASSIGNMENT: AssignmentRow = {
  id: "",
  personAdoId: "",
  personDisplayName: "",
  projectId: "",
  projectName: "",
  teamId: null,
  teamName: null,
  roleId: "",
  roleName: "",
  roleDisplayName: "",
  assignmentPct: 100,
  assignedMonth: null,
  validFrom: "",
  validTo: null,
  status: "vigente",
  createdByUserId: "",
  createdByDisplayName: null,
  createdAt: "",
};

const OPEN_END_MS = Date.parse("9999-12-31T00:00:00Z");

function allocationItemOf(r: AssignmentDto): AllocationItem {
  return {
    projectName: r.projectName,
    teamName: r.teamName,
    pct: r.assignmentPct,
    fromMs: Date.parse(r.validFrom),
    toMs: r.validTo ? Date.parse(r.validTo) : null,
  };
}

/**
 * Periodo de búsqueda: el rango de fechas (si se usó) tiene precedencia sobre
 * el mes del contexto. Devuelve null si no hay ninguno.
 */
function resolvePeriod(
  month: string,
  from: string,
  to: string,
): { fromMs: number; toMs: number } | null {
  if (from || to) {
    return {
      fromMs: from ? Date.parse(from) : 0,
      toMs: to ? Date.parse(to) : OPEN_END_MS,
    };
  }
  if (month) {
    const r = monthToDateRange(month);
    if (r) return { fromMs: Date.parse(r.from), toMs: Date.parse(r.to) };
  }
  return null;
}

function rowOverlapsPeriod(
  row: AssignmentDto,
  period: { fromMs: number; toMs: number },
): boolean {
  const rowFrom = Date.parse(row.validFrom);
  const rowTo = row.validTo ? Date.parse(row.validTo) : OPEN_END_MS;
  return rowFrom <= period.toMs && period.fromMs <= rowTo;
}

function monthLabel(month: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const [, year, mm] = m;
  const names = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const idx = Number(mm) - 1;
  if (idx < 0 || idx > 11) return null;
  return `${names[idx]} ${year}`;
}

export function AssignmentsShell({
  initialAssignments,
  catalog,
}: AssignmentsShellProps) {
  const { rows, createRow, closeRow, updatePctRow, deleteRow } =
    useAssignments(initialAssignments);
  const { selection, setProject, setTeam } =
    useAssignmentsContextUrl({
      defaultProject: catalog.project,
      defaultTeam: catalog.team,
    });
  const { saveDefaults, saveDefaultsPending } = useSaveAdoContextDefaults({
    catalog,
  });

  const [filters, setFilters] = useState<AssignmentsFiltersValue>(
    EMPTY_ASSIGNMENTS_FILTERS,
  );

  const visibleRows = useMemo(() => {
    const projectLc = selection.project.trim().toLowerCase();
    const personLc = filters.personQuery.trim().toLowerCase();
    const period = resolvePeriod(filters.month, filters.from, filters.to);
    return rows.filter((row) => {
      if (projectLc && row.projectName.toLowerCase() !== projectLc) {
        return false;
      }
      if (personLc && !row.personDisplayName.toLowerCase().includes(personLc)) {
        return false;
      }
      if (period && !rowOverlapsPeriod(row, period)) {
        return false;
      }
      return true;
    });
  }, [rows, selection.project, filters]);

  const [closeTarget, setCloseTarget] = useState<AssignmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRow | null>(null);

  // Edición en línea del %: mapa id → valor del input. Una fila está en
  // edición si su id es clave de este objeto.
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingPct, setSavingPct] = useState(false);

  const editIds = Object.keys(editing);
  const hasEdits = editIds.length > 0;
  const allEditsValid = editIds.every((id) => isPctValueValid(editing[id]));

  const toggleEdit = useCallback((row: AssignmentRow) => {
    setEditing((prev) => {
      if (Object.hasOwn(prev, row.id)) {
        const next = { ...prev };
        delete next[row.id];
        return next;
      }
      return { ...prev, [row.id]: String(row.assignmentPct) };
    });
  }, []);

  const setEditValue = useCallback((id: string, value: string) => {
    setEditing((prev) => ({ ...prev, [id]: value }));
  }, []);

  const dropFromEditing = useCallback((id: string) => {
    setEditing((prev) => {
      if (!Object.hasOwn(prev, id)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  async function handleSaveEdits(): Promise<void> {
    if (savingPct || !allEditsValid) return;
    // Solo persistimos las filas cuyo % realmente cambió.
    const changed = editIds
      .map((id) => ({ id, pct: Number(editing[id]) }))
      .filter(({ id, pct }) => {
        const row = rows.find((r) => r.id === id);
        return row != null && row.assignmentPct !== pct;
      });

    if (changed.length === 0) {
      setEditing({});
      appToast.info("No hay cambios de porcentaje que guardar.");
      return;
    }

    // Pre-validación global (100% sumando todos los proyectos del usuario)
    // para dar feedback inmediato antes de llamar al backend.
    const toPersist: { id: string; pct: number }[] = [];
    // Sobreasignación: se muestra como advertencia (warning), no como error.
    const warnings = new Map<string, MessageSegment[]>();
    const errors = new Set<string>();
    const failedIds: string[] = [];
    for (const { id, pct } of changed) {
      const row = rows.find((r) => r.id === id);
      if (!row) continue;
      const check = checkOverAllocation({
        personDisplayName: row.personDisplayName,
        others: rows
          .filter((r) => r.personAdoId === row.personAdoId && r.id !== id)
          .map(allocationItemOf),
        candidate: {
          fromMs: Date.parse(row.validFrom),
          toMs: row.validTo ? Date.parse(row.validTo) : null,
          pct,
          projectName: row.projectName,
          teamName: row.teamName,
        },
      });
      if (check.ok) {
        toPersist.push({ id, pct });
      } else {
        warnings.set(check.message, check.segments);
        failedIds.push(id);
      }
    }

    if (toPersist.length > 0) {
      setSavingPct(true);
      const results = await Promise.all(
        toPersist.map(async ({ id, pct }) => ({
          id,
          res: await updatePctRow(id, pct),
        })),
      );
      setSavingPct(false);
      for (const { id, res } of results) {
        if (!res.ok) {
          failedIds.push(id);
          errors.add(res.message);
        }
      }
    }

    if (failedIds.length === 0) {
      setEditing({});
      appToast.success("Porcentajes actualizados.");
      return;
    }
    // Mantener en edición solo las filas que fallaron para reintentar.
    setEditing((prev) => {
      const next: Record<string, string> = {};
      for (const id of failedIds) {
        if (Object.hasOwn(prev, id)) next[id] = prev[id];
      }
      return next;
    });
    for (const segments of warnings.values()) {
      appToast.warning(<OverAllocationMessage segments={segments} />);
    }
    for (const msg of errors) appToast.error(msg);
  }

  const defaultContext: AssignmentDefaultContext = {
    project: selection.project ? { id: "", name: selection.project } : null,
    team: selection.team ? { id: "", name: selection.team } : null,
  };

  const summary = buildAdoFiltersSummary({
    project: selection.project || undefined,
    team: selection.team || undefined,
    extraParts: [
      monthLabel(filters.month) ? `Mes: ${monthLabel(filters.month)}` : "",
    ],
  });

  async function handleCreate(
    input: CreateAssignmentPayload,
  ): Promise<{ ok: boolean; error?: string }> {
    const result = await createRow(input);
    if (result.ok) return { ok: result.assignments.length > 0 };
    return { ok: false, error: result.message };
  }

  async function handleDelete(target: AssignmentRow): Promise<boolean> {
    const ok = await deleteRow(target.id);
    if (ok) dropFromEditing(target.id);
    return ok;
  }

  async function handleClose(
    target: AssignmentRow,
    payload: CloseAssignmentPayload,
  ): Promise<boolean> {
    const updated = await closeRow(target.id, payload);
    return updated !== null;
  }

  function handleClearFilters() {
    setFilters(EMPTY_ASSIGNMENTS_FILTERS);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AdoFiltersCollapsible
        title="Contexto"
        summary={summary}
        defaultOpen={false}
        className="w-full"
      >
        <AssignmentsContextFields
          catalog={catalog}
          selection={selection}
          onProjectChange={setProject}
          onTeamChange={setTeam}
        />
        <AdoContextTeamDefaultHint
          project={selection.project}
          team={selection.team}
          defaultProject={catalog.defaultProject}
          defaultTeam={catalog.defaultTeam}
          pending={saveDefaultsPending}
          onSave={() => {
            saveDefaults().catch(() => undefined);
          }}
        />
      </AdoFiltersCollapsible>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AssignmentsFilters
            value={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>
        <div className="flex items-end gap-2">
          <AssignmentFormDialog
            catalog={catalog}
            loadMembers={(projectName, teamName) =>
              listTeamMembersByProjectAndTeam(projectName, teamName)
            }
            onSubmit={handleCreate}
            existingAssignments={rows}
            defaultContext={defaultContext}
          />
          {hasEdits ? (
            <Button
              type="button"
              onClick={() => void handleSaveEdits()}
              disabled={savingPct || !allEditsValid}
            >
              {savingPct ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Guardar
            </Button>
          ) : null}
        </div>
      </div>

      <AssignmentsTable
        rows={visibleRows}
        editing={editing}
        onToggleEdit={toggleEdit}
        onEditValueChange={setEditValue}
        onClose={setCloseTarget}
        onDelete={setDeleteTarget}
      />

      <AssignmentDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        assignment={deleteTarget ?? PLACEHOLDER_ASSIGNMENT}
        onConfirm={() =>
          deleteTarget ? handleDelete(deleteTarget) : Promise.resolve(false)
        }
      />

      <AssignmentCloseDialog
        open={closeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setCloseTarget(null);
        }}
        assignment={closeTarget ?? PLACEHOLDER_ASSIGNMENT}
        onSubmit={(payload) =>
          closeTarget
            ? handleClose(closeTarget, payload)
            : Promise.resolve(false)
        }
      />
    </div>
  );
}
