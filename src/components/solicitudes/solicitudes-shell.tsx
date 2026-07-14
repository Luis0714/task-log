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
import {
  WORK_ITEM_ASSIGNEE_ME,
  parseAssigneeFilter,
} from "@/lib/schemas/work-item-filters";
import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";

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

/**
 * ¿El solicitante coincide con el filtro de asignado? Parseamos el formato
 * estándar `all` / `me` / `name|name|...` y comparamos por displayName /
 * uniqueName. La lógica vive aquí (en el shell) porque las solicitudes no
 * tienen un identificador de persona estable, solo el `assignedTo` que ADO
 * guarda como `DisplayName <uniqueName>` o `DisplayName`.
 *
 * Para `includeMe` necesitamos saber quién es el usuario logueado: lo
 * recibimos como `currentUserDisplayName` y resolvemos contra el roster del
 * proyecto (no asumimos que el primer miembro con `uniqueName` sea "yo").
 */
function matchesAssigneeFilter(
  solicitud: SolicitudDto,
  filter: string,
  members: readonly { displayName: string; uniqueName?: string }[],
  currentUserDisplayName: string | null,
): boolean {
  const parsed = parseAssigneeFilter(filter);
  if (parsed.kind === "all") return true;

  const member = findTeamMemberByAssigneeName(members, solicitud.assignedTo ?? "");
  const memberName = member?.displayName ?? solicitud.assignedTo ?? "";
  if (!memberName) return false;

  if (parsed.includeMe && currentUserDisplayName) {
    const me = members.find(
      (m) => normalize(m.displayName) === normalize(currentUserDisplayName),
    );
    if (me && normalize(memberName) === normalize(me.displayName)) return true;
  }
  return parsed.names.some((name) => normalize(name) === normalize(memberName));
}

/** `[]` = "sin selección, todos seleccionados" (mismo criterio que el reporte
 * de horas por periodo). Se cruza con `available` para ignorar IDs obsoletos. */
function effectiveSelection(
  selected: readonly string[],
  available: readonly string[],
): string[] {
  if (selected.length === 0) return [...available];
  const valid = new Set(available);
  return selected.filter((id) => valid.has(id));
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

  // Filtros del listado — defaults idénticos a /admin/novedades: el proyecto
  // y equipo predeterminados del catálogo (no "todos"). Si no hay defaultTeam
  // (p. ej. proyecto sin equipos), el filtro de equipo queda en "todos".
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() =>
    defaultProject ? [defaultProject] : [],
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() =>
    defaultTeam ? [defaultTeam] : [],
  );
  const [assigneeFilter, setAssigneeFilter] = useState<string>(WORK_ITEM_ASSIGNEE_ME);

  const catalog = useSolicitudCatalog(defaultProject);
  const members = useMemo(() => catalog.options?.members ?? [], [catalog.options]);
  const teams = useMemo(() => catalog.options?.teams ?? [], [catalog.options]);
  const effectiveProjects = useMemo(
    () => effectiveSelection(selectedProjectIds, projects),
    [selectedProjectIds, projects],
  );
  const effectiveTeams = useMemo(
    () => effectiveSelection(selectedTeamIds, teams),
    [selectedTeamIds, teams],
  );

  // Map parentId → teamId para resolver el equipo de cada solicitud.
  const parentTeamById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const story of catalog.options?.newsStories ?? []) {
      map.set(story.workItemId, story.teamId);
    }
    return map;
  }, [catalog.options]);

  const filteredSolicitudes = useMemo(() => {
    const teamSet = new Set(effectiveTeams);
    return solicitudes.filter((solicitud) => {
      if (teamSet.size > 0) {
        const teamId =
          solicitud.parentId !== null ? parentTeamById.get(solicitud.parentId) : null;
        if (teamId !== null && teamId !== undefined && !teamSet.has(teamId)) return false;
      }
      if (!matchesAssigneeFilter(solicitud, assigneeFilter, members, currentUserDisplayName)) return false;
      return true;
    });
  }, [solicitudes, effectiveTeams, parentTeamById, assigneeFilter, members, currentUserDisplayName]);

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
        selectedProjectIds={effectiveProjects}
        onProjectIdsChange={setSelectedProjectIds}
        teams={teams}
        selectedTeamIds={effectiveTeams}
        onTeamIdsChange={setSelectedTeamIds}
        assigneeValue={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        members={members}
        membersLoading={catalog.loading}
        membersError={null}
      />

      <SolicitudesTable
        solicitudes={filteredSolicitudes}
        project={defaultProject}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
      />

      <SolicitudFormDialog
        open={dialogMode !== null}
        onOpenChange={handleOpenChange}
        config={{
          projects,
          defaultProject,
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
