"use client";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SolicitudesFiltersBarProps = Readonly<{
  projects: readonly string[];
  projectValue: string;
  onProjectChange: (value: string) => void;

  /** Equipos del proyecto actual. `[]` deshabilita el filtro. */
  teams: readonly string[];
  /** "all" = sin filtro. */
  teamValue: string;
  onTeamChange: (value: string) => void;

  /** Texto a buscar en `assignedTo`. Vacío = sin filtro. */
  assigneeValue: string;
  onAssigneeChange: (value: string) => void;

  /** Etiqueta de placeholder para "Asignado a". */
  assigneePlaceholder?: string;
  /** Nombre del usuario logueado (usado para mostrar "Mi nombre (yo)"). */
  currentUserDisplayName?: string | null;
}>;

/**
 * Filtros del listado "Mis solicitudes": proyecto, equipo y persona asignada.
 * Mismo patrón que el filtro de "Historias de usuario" (assignee text + selects
 * controlados). El usuario logueado entra por defecto en "Asignado a".
 */
export function SolicitudesFiltersBar({
  projects,
  projectValue,
  onProjectChange,
  teams,
  teamValue,
  onTeamChange,
  assigneeValue,
  onAssigneeChange,
  assigneePlaceholder,
  currentUserDisplayName,
}: SolicitudesFiltersBarProps) {
  const projectOptions = projects.map((project) => ({ value: project, label: project }));
  const teamOptions = [
    { value: "all", label: "Todos los equipos" },
    ...teams.map((team) => ({ value: team, label: team })),
  ];

  // Si el valor actual del assignee coincide con el usuario logueado, mostramos
  // un placeholder que lo resalta para que sea obvio por qué aparece por
  // defecto.
  const placeholder =
    assigneePlaceholder ??
    (currentUserDisplayName
      ? `${currentUserDisplayName} (yo)`
      : "Buscar por nombre…");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ControlledSelectField
        label="Proyecto"
        value={projectValue}
        placeholder="Selecciona un proyecto"
        options={projectOptions}
        onValueChange={onProjectChange}
      />
      <ControlledSelectField
        label="Equipo"
        value={teamValue}
        placeholder="Todos los equipos"
        options={teamOptions}
        disabled={teams.length === 0}
        emptyMessage="Este proyecto no tiene equipos."
        onValueChange={(value) => onTeamChange(value === "all" ? "" : value)}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="solicitudes-assignee-filter">Asignado a</Label>
        <Input
          id="solicitudes-assignee-filter"
          type="text"
          value={assigneeValue}
          onChange={(event) => onAssigneeChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
