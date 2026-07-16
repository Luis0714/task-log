"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import { AssignmentsTable } from "@/components/assignments/assignments-table";
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
import {
  pruneTeamSelection,
  teamNamesForProjects,
} from "@/lib/filters/teams-by-project";

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

  const [filters, setFilters] = useState<AssignmentsFiltersValue>(() => {
    const projects =
      urlProjects.length > 0 ? [...urlProjects] : [...defaultProjectNames];
    return {
      personQuery: "",
      projects,
      teams: pruneTeamSelection(
        urlTeams.length > 0 ? urlTeams : defaultTeamNames,
        teamNamesForProjects(catalog.teamsByProject, projects),
      ),
      month: currentMonthKey(),
    };
  });

  useEffect(() => {
    if (urlProjects.length === 0 && defaultProjectNames.length > 0) {
      persistProjects(defaultProjectNames);
    }
    if (urlTeams.length === 0 && defaultTeamNames.length > 0) {
      persistTeams(defaultTeamNames);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectLabels = useMemo(
    () => catalog.projects.map((p) => p.name),
    [catalog.projects],
  );
  const filterProjectOptions = useMemo(
    () => catalog.projects.map((p) => ({ value: p.name, label: p.name })),
    [catalog.projects],
  );
  // Equipos disponibles según los proyectos filtrados (unión de sus equipos).
  const availableTeamNames = useMemo(
    () => teamNamesForProjects(catalog.teamsByProject, filters.projects),
    [catalog.teamsByProject, filters.projects],
  );
  const filterTeamOptions = useMemo(
    () => availableTeamNames.map((name) => ({ value: name, label: name })),
    [availableTeamNames],
  );
  // Equipos de cada proyecto para los diálogos de crear/editar asignación.
  const teamOptionsByProject = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(catalog.teamsByProject).map(([project, teams]) => [
          project,
          teams.map((t) => ({ value: t.name, label: t.name })),
        ]),
      ),
    [catalog.teamsByProject],
  );

  const slots = useMemo(
    () =>
      buildDefaultSlots(
        filters.projects,
        filters.teams,
        projectLabels,
        availableTeamNames,
      ),
    [filters.projects, filters.teams, projectLabels, availableTeamNames],
  );

  const { defaults, loading: defaultsLoading, removeDefault } = useInferredDefaults(slots);
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
  const totalNoun = totalAll === 1 ? "asignación" : "asignaciones";

  function handleFiltersChange(next: AssignmentsFiltersValue) {
    // Cambiar los proyectos poda los equipos que dejan de estar disponibles.
    const value = {
      ...next,
      teams: pruneTeamSelection(
        next.teams,
        teamNamesForProjects(catalog.teamsByProject, next.projects),
      ),
    };
    setFilters(value);
    persistProjects(value.projects);
    persistTeams(value.teams);
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
        {defaultsLoading
          ? "Cargando asignaciones…"
          : `Mostrando ${totalVisible} de ${totalAll} ${totalNoun}`}
      </p>
      <AssignmentsTable
        rows={visibleRows}
        defaults={visibleDefaults}
        pendingDefaults={defaultsLoading}
        projectOptions={filterProjectOptions}
        teamOptionsByProject={teamOptionsByProject}
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
