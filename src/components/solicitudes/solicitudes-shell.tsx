"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SolicitudesTable } from "@/components/solicitudes/solicitudes-table";
import { SolicitudFormDialog } from "@/components/solicitudes/solicitud-form-dialog";
import { SolicitudesFiltersBar } from "@/components/solicitudes/solicitudes-filters-bar";
import { useSolicitudCatalog } from "@/hooks/solicitudes/use-solicitud-catalog";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudesShellProps = Readonly<{
  initialSolicitudes: readonly SolicitudDto[];
  projects: readonly string[];
  defaultProject: string;
  /** Equipo por defecto del catálogo (mismo origen que /admin/novedades). */
  defaultTeam: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  isManagement: boolean;
}>;

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLocaleLowerCase("es");
}

export function SolicitudesShell({
  initialSolicitudes,
  projects,
  defaultProject,
  defaultTeam,
  currentUserDisplayName,
  holidayKeys,
  isManagement,
}: SolicitudesShellProps) {
  const [solicitudes, setSolicitudes] = useState<readonly SolicitudDto[]>(initialSolicitudes);
  // `null` = dialog cerrado; `"create"` / `"edit"` = modo activo.
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudDto | null>(null);

  // Filtros del listado. Por defecto el asignado soy yo (espejo del patrón
  // de "Historias de usuario"): el resto de filtros arrancan en blanco/Todos.
  const [projectFilter, setProjectFilter] = useState(defaultProject);
  const [teamFilter, setTeamFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState(currentUserDisplayName ?? "");

  // Catálogo del proyecto seleccionado: alimenta el select de equipo y el
  // mapeo parentId → teamId necesario para filtrar por equipo.
  const catalog = useSolicitudCatalog(projectFilter);

  // Map parentId → teamId para resolver el equipo de cada solicitud.
  const parentTeamById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const story of catalog.options?.newsStories ?? []) {
      map.set(story.workItemId, story.teamId);
    }
    return map;
  }, [catalog.options]);

  const filteredSolicitudes = useMemo(() => {
    const assigneeQuery = normalize(assigneeFilter);
    return solicitudes.filter((solicitud) => {
      if (teamFilter) {
        const teamId = solicitud.parentId !== null
          ? parentTeamById.get(solicitud.parentId)
          : null;
        // teamId null (HU a nivel proyecto) muestra en cualquier equipo.
        if (teamId !== null && teamId !== teamFilter) return false;
      }
      if (assigneeQuery && !normalize(solicitud.assignedTo).includes(assigneeQuery)) {
        return false;
      }
      return true;
    });
  }, [solicitudes, teamFilter, assigneeFilter, parentTeamById]);

  const handleSaved = useCallback((saved: SolicitudDto) => {
    setSolicitudes((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    setDialogMode(null);
    setEditingSolicitud(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingSolicitud(null);
    setDialogMode("create");
  }, []);

  const handleEdit = useCallback((solicitud: SolicitudDto) => {
    setEditingSolicitud(solicitud);
    setDialogMode("edit");
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDialogMode(null);
      setEditingSolicitud(null);
    }
  }, []);

  const handleDeleted = useCallback((solicitud: SolicitudDto) => {
    setSolicitudes((prev) => prev.filter((item) => item.id !== solicitud.id));
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Mis solicitudes"
        description="Registra tus novedades (permisos, incapacidades y más) sin entrar a Azure DevOps."
        action={
          <Button type="button" onClick={handleOpenCreate}>
            <Plus className="size-4" aria-hidden />
            Nueva solicitud
          </Button>
        }
      />

      <SolicitudesFiltersBar
        projects={projects}
        projectValue={projectFilter}
        onProjectChange={setProjectFilter}
        teams={catalog.options?.teams ?? []}
        teamValue={teamFilter}
        onTeamChange={setTeamFilter}
        assigneeValue={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        currentUserDisplayName={currentUserDisplayName}
      />

      <SolicitudesTable
        solicitudes={filteredSolicitudes}
        project={projectFilter || defaultProject}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
      />

      <SolicitudFormDialog
        open={dialogMode !== null}
        onOpenChange={handleOpenChange}
        config={{
          projects,
          defaultProject: projectFilter || defaultProject,
          defaultTeam,
          currentUserDisplayName,
          holidayKeys,
          isManagement,
          mode: dialogMode ?? "create",
          ...(dialogMode === "edit" && editingSolicitud
            ? { initialSolicitud: editingSolicitud }
            : {}),
          onSaved: handleSaved,
        }}
      />
    </div>
  );
}
