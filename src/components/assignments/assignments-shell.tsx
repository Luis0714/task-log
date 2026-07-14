"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import {
  AssignmentsTable,
  type ProjectOption,
  type TeamOption,
} from "@/components/assignments/assignments-table";
import {
  AssignmentsFilters,
  type AssignmentsFiltersValue,
} from "@/components/assignments/assignments-filters";
import { useAssignments } from "@/hooks/assignments/use-assignments";
import { useAssignmentsContextUrl } from "@/hooks/assignments/use-assignments-context-url";
import { useInferredDefaults } from "@/hooks/assignments/use-inferred-defaults";
import { useAssignmentActions } from "@/hooks/assignments/use-assignment-actions";
import { buildDefaultSlots } from "@/lib/assignments/default-slots";
import {
  filterAssignmentRows,
  filterByPersonName,
} from "@/lib/assignments/filter-assignments";

export type AssignmentsShellProps = Readonly<{
  initialAssignments: AssignmentDto[];
  catalog: AdoCatalogSnapshot;
}>;

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AssignmentsShell({
  initialAssignments,
  catalog,
}: AssignmentsShellProps) {
  const { rows, createRow, editCell, deleteRow } = useAssignments(initialAssignments);

  const defaultProjectNames = useMemo(
    () => (catalog.defaultProject ? [catalog.defaultProject] : []),
    [catalog.defaultProject],
  );
  const defaultTeamNames = useMemo(
    () => (catalog.defaultTeam ? [catalog.defaultTeam] : []),
    [catalog.defaultTeam],
  );

  const {
    selection: { projects: urlProjects, teams: urlTeams },
    setProjects: persistProjects,
    setTeams: persistTeams,
  } = useAssignmentsContextUrl({
    defaultProjects: defaultProjectNames,
    defaultTeams: defaultTeamNames,
  });

  const [filters, setFilters] = useState<AssignmentsFiltersValue>(() => ({
    personQuery: "",
    projects: urlProjects.length > 0 ? [...urlProjects] : [...defaultProjectNames],
    teams: urlTeams.length > 0 ? [...urlTeams] : [...defaultTeamNames],
    month: currentMonthKey(),
  }));

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
  const projectLabels = useMemo(
    () => projectOptions.map((p) => p.label),
    [projectOptions],
  );
  const filterProjectOptions = useMemo(
    () => projectOptions.map((p) => ({ value: p.value, label: p.label })),
    [projectOptions],
  );
  const filterTeamOptions = useMemo(
    () => catalog.teams.map((t) => ({ value: t.name, label: t.name })),
    [catalog.teams],
  );
  const catalogTeamNames = useMemo(
    () => catalog.teams.map((t) => t.name),
    [catalog.teams],
  );

  const slots = useMemo(
    () =>
      buildDefaultSlots(
        filters.projects,
        filters.teams,
        projectLabels,
        catalogTeamNames,
      ),
    [filters.projects, filters.teams, projectLabels, catalogTeamNames],
  );

  const { defaults, initialLoading, removeDefault } = useInferredDefaults(slots);
  const { handleCellChange, handleDelete, handleDefaultCreate } =
    useAssignmentActions({ createRow, editCell, deleteRow, removeDefault });

  const visibleRows = useMemo(
    () => filterAssignmentRows(rows, filters),
    [rows, filters],
  );
  const visibleDefaults = useMemo(
    () => filterByPersonName(defaults, filters.personQuery),
    [defaults, filters.personQuery],
  );
  const totalVisible = visibleRows.length + visibleDefaults.length;
  const totalAll = rows.length + defaults.length;

  function handleFiltersChange(next: AssignmentsFiltersValue) {
    setFilters(next);
    persistProjects(next.projects);
    persistTeams(next.teams);
  }

  function handleClearFilters() {
    handleFiltersChange({
      personQuery: "",
      projects: [...defaultProjectNames],
      teams: [...defaultTeamNames],
      month: currentMonthKey(),
    });
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
        {initialLoading
          ? "Cargando asignaciones…"
          : `Mostrando ${totalVisible} de ${totalAll} ${
              totalAll === 1 ? "asignación" : "asignaciones"
            }`}
      </p>
      <AssignmentsTable
        rows={visibleRows}
        defaults={visibleDefaults}
        pendingDefaults={initialLoading}
        projectOptions={filterProjectOptions}
        teamOptions={filterTeamOptions}
        onCellChange={(rowRef, patch) =>
          rowRef.kind === "assignment"
            ? handleCellChange(rowRef.id, patch)
            : Promise.resolve({ ok: true })
        }
        onDefaultCreate={handleDefaultCreate}
        onDelete={handleDelete}
      />
    </div>
  );
}
