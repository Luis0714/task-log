"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import {
  AssignmentsTable,
  type InferredDefaultRow,
  type ProjectOption,
  type TeamOption,
  defaultKeyOf,
} from "@/components/assignments/assignments-table";
import {
  AssignmentsFilters,
  type AssignmentsFiltersValue,
} from "@/components/assignments/assignments-filters";
import {
  useAssignments,
  type AssignmentRow,
} from "@/hooks/assignments/use-assignments";
import { useAssignmentsContextUrl } from "@/hooks/assignments/use-assignments-context-url";
import {
  listInferredDefaults,
  type EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import { appToast } from "@/lib/toast";

/**
 * Normaliza un string para búsqueda: minúsculas + sin diacríticos + trim.
 * Sirve para que "jose" matchee "José", "maria" matchee "María", etc.
 */
function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export type AssignmentsShellProps = Readonly<{
  initialAssignments: AssignmentDto[];
  catalog: AdoCatalogSnapshot;
}>;

export function AssignmentsShell({
  initialAssignments,
  catalog,
}: AssignmentsShellProps) {
  const { rows, createRow, editCell, deleteRow } = useAssignments(initialAssignments);
  const {
    selection: { projects: urlProjects, teams: urlTeams },
    setProjects: persistProjects,
    setTeams: persistTeams,
  } = useAssignmentsContextUrl({
    defaultProjects: catalog.defaultProject ? [catalog.defaultProject] : [],
    defaultTeams: catalog.defaultTeam ? [catalog.defaultTeam] : [],
  });

  const defaultProjectNames = useMemo(
    () => (catalog.defaultProject ? [catalog.defaultProject] : []),
    [catalog.defaultProject],
  );
  const defaultTeamNames = useMemo(
    () => (catalog.defaultTeam ? [catalog.defaultTeam] : []),
    [catalog.defaultTeam],
  );

  const [filters, setFilters] = useState<AssignmentsFiltersValue>(() => ({
    personQuery: "",
    projects: urlProjects.length > 0 ? [...urlProjects] : [...defaultProjectNames],
    teams: urlTeams.length > 0 ? [...urlTeams] : [...defaultTeamNames],
    month: defaultMonthKey(),
  }));
  const [defaults, setDefaults] = useState<InferredDefaultRow[]>([]);
  /** Mientras la inferencia de filas "por defecto" está en vuelo. */
  const [defaultsPending, setDefaultsPending] = useState(true);

  useEffect(() => {
    if (urlProjects.length === 0 && defaultProjectNames.length > 0) {
      persistProjects(defaultProjectNames);
    }
    if (urlTeams.length === 0 && defaultTeamNames.length > 0) {
      persistTeams(defaultTeamNames);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectOptions: ProjectOption[] = useMemo(
    () =>
      catalog.projects.map((p) => ({
        value: p.name,
        label: p.name,
        teams: catalog.teams.map<TeamOption>((t) => ({
          value: t.id ?? t.name,
          label: t.name,
        })),
      })),
    [catalog.projects, catalog.teams],
  );

  const filterProjectOptions = useMemo(
    () => projectOptions.map((p) => ({ value: p.value, label: p.label })),
    [projectOptions],
  );

  const filterTeamOptions = useMemo(
    () =>
      catalog.teams.map((t) => ({
        value: t.name,
        label: t.name,
      })),
    [catalog.teams],
  );

  useEffect(() => {
    const projects =
      filters.projects.length > 0
        ? filters.projects
        : projectOptions.map((p) => p.label);
    if (projects.length === 0) {
      setDefaults([]);
      setDefaultsPending(false);
      return;
    }

    const teams = filters.teams.length > 0 ? filters.teams : null;
    const slots = projects.flatMap((projectLabel) =>
      (teams ?? catalog.teams.map((t) => t.name)).map((teamName) => ({
        projectLabel,
        teamName,
      })),
    );

    if (slots.length === 0) {
      setDefaults([]);
      setDefaultsPending(false);
      return;
    }

    let cancelled = false;
    setDefaults([]);
    setDefaultsPending(true);
    resolveDefaultRows(slots)
      .then((rows) => {
        if (cancelled) return;
        setDefaults(rows);
        setDefaultsPending(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDefaults([]);
        setDefaultsPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.projects, filters.teams, projectOptions, catalog.teams]);

  const visibleRows = useMemo(() => {
    const personLc = normalizeForSearch(filters.personQuery);
    return rows.filter((row) => {
      if (
        personLc &&
        !normalizeForSearch(row.personDisplayName).includes(personLc)
      ) {
        return false;
      }
      const inProject =
        filters.projects.length === 0 || filters.projects.includes(row.projectName);
      if (!inProject) return false;
      const inTeam =
        filters.teams.length === 0 ||
        (row.teamName !== null && filters.teams.includes(row.teamName));
      return inTeam;
    });
  }, [rows, filters.personQuery, filters.projects, filters.teams]);

  // Las filas "Por defecto" ya se generan a partir de los proyectos/equipos
  // seleccionados, pero deben respetar también la búsqueda por nombre.
  const visibleDefaults = useMemo(() => {
    const personLc = normalizeForSearch(filters.personQuery);
    if (!personLc) return defaults;
    return defaults.filter((d) =>
      normalizeForSearch(d.personDisplayName).includes(personLc),
    );
  }, [defaults, filters.personQuery]);

  function handleFiltersChange(next: AssignmentsFiltersValue) {
    setFilters(next);
    persistProjects(next.projects);
    persistTeams(next.teams);
  }

  function handleClearFilters() {
    setFilters({
      personQuery: "",
      projects: [...defaultProjectNames],
      teams: [...defaultTeamNames],
      month: defaultMonthKey(),
    });
    persistProjects(defaultProjectNames);
    persistTeams(defaultTeamNames);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <AssignmentsFilters
        value={filters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
        projectOptions={filterProjectOptions}
        teamOptions={filterTeamOptions}
        defaultProjects={defaultProjectNames}
        defaultTeams={defaultTeamNames}
      />
      <p className="text-muted-foreground text-xs">
        Mostrando {visibleRows.length + visibleDefaults.length} de {rows.length + defaults.length}{" "}
        {rows.length + defaults.length === 1 ? "asignación" : "asignaciones"}
      </p>
      <AssignmentsTable
        rows={visibleRows}
        defaults={visibleDefaults}
        pendingDefaults={defaultsPending}
        projectOptions={filterProjectOptions}
        teamOptions={filterTeamOptions}
        onCellChange={(rowRef, patch) => {
          if (rowRef.kind !== "assignment") return Promise.resolve({ ok: true });
          return handleCellChange(rowRef.id, patch);
        }}
        onDefaultCreate={handleDefaultCreate}
        onCloseVigencia={(row, validTo) => handleCloseVigencia(row, validTo)}
        onDelete={handleDelete}
      />
    </div>
  );

  async function handleCellChange(
    id: string,
    patch: EditAssignmentPayload,
  ): Promise<{ ok: boolean; message?: string }> {
    if (Object.keys(patch).length === 0) return { ok: true };
    const res = await editCell(id, patch);
    if (!res.ok) {
      appToast.error(res.message);
      return { ok: false, message: res.message };
    }
    appToast.success("Asignación actualizada.");
    return { ok: true };
  }

  async function handleDelete(row: AssignmentRow): Promise<{ ok: boolean; message?: string }> {
    const ok = await deleteRow(row.id);
    if (!ok) {
      const message = "No se pudo eliminar la asignación.";
      appToast.error(message);
      return { ok: false, message };
    }
    appToast.success("Asignación eliminada.");
    return { ok: true };
  }

  async function handleDefaultCreate(
    defaultRow: InferredDefaultRow,
    payload: EditAssignmentPayload,
  ): Promise<{ ok: boolean; message?: string }> {
    // Usamos `createRow` (del hook) en vez de un fetch suelto para que la
    // asignación recién creada quede en `rows` y la tabla la muestre de
    // inmediato — si no, la fila "Por defecto" desaparece pero la real nunca
    // aparece hasta recargar.
    const result = await createRow({
      personAdoId: defaultRow.personAdoId,
      personDisplayName: defaultRow.personDisplayName,
      projectId: payload.projectId ?? defaultRow.projectId,
      projectName: payload.projectName ?? defaultRow.projectName,
      teamId: payload.teamId ?? null,
      teamName: payload.teamName ?? null,
      roleId: payload.roleId ?? null,
      assignmentPct: payload.assignmentPct ?? 100,
      validFrom: payload.validFrom ?? todayKey(),
      validTo: payload.validTo ?? undefined,
    });
    if (!result.ok) {
      appToast.error(result.message);
      return { ok: false, message: result.message };
    }
    appToast.success("Asignación creada.");
    setDefaults((prev) =>
      prev.filter((d) => d.defaultKey !== defaultRow.defaultKey),
    );
    return { ok: true };
  }
}

async function resolveDefaultRows(
  slots: { projectLabel: string; teamName: string }[],
): Promise<InferredDefaultRow[]> {
  const memberLists = await Promise.all(
    slots.map(async ({ projectLabel, teamName }) => {
      const members = await fetchTeamMembers(projectLabel, teamName);
      return members.map((m) => ({
        projectLabel,
        teamName,
        personAdoId: m.id,
        personDisplayName: m.displayName,
      }));
    }),
  );
  const allMembers = memberLists.flat();
  const inputMembers = allMembers.map((m) => ({
    personAdoId: m.personAdoId,
    personDisplayName: m.personDisplayName,
    projectId: m.projectLabel,
    projectName: m.projectLabel,
    teamId: m.teamName,
    teamName: m.teamName,
  }));
  const inferred = await listInferredDefaults(inputMembers);
  return inferred.map((d) => ({
    defaultKey: defaultKeyOf(d),
    personAdoId: d.personAdoId,
    personDisplayName: d.personDisplayName,
    projectId: d.projectId,
    projectName: d.projectName,
    teamId: d.teamId,
    teamName: d.teamName,
  }));
}

async function handleCloseVigencia(
  row: AssignmentRow,
  validTo: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/assignments/${row.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validTo }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      const message = err.error ?? "No se pudo cerrar la vigencia.";
      appToast.error(message);
      return { ok: false, message };
    }
    appToast.success("Vigencia cerrada.");
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "No se pudo cerrar la vigencia.";
    appToast.error(message);
    return { ok: false, message };
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchTeamMembers(
  project: string,
  team: string,
): Promise<{ id: string; displayName: string }[]> {
  const url = `/api/ado/team-members?${new URLSearchParams({ project, team }).toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    members: { id: string; displayName: string }[];
  };
  return body.members;
}
