"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import type { FormSelectOption } from "@/components/time-log/fields/controlled-select-field";
import { DatePicker } from "@/components/ui/date-picker";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoTeamMember } from "@/services/assignments/assignments.service";
import type {
  AssignmentDefaultContext,
  CreateAssignmentPayload,
} from "@/services/assignments/assignments.service";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_USER_MESSAGES } from "@/lib/assignments/error-codes";
import type { WorkingDayDecisionDto } from "@/services/assignments/working-day-decisions.service";
import { WorkingDayDecisionsPanel } from "@/components/assignments/working-day-decisions-panel";

export type AssignmentFormDialogProps = {
  catalog: AdoCatalogSnapshot;
  loadMembers: (projectName: string, teamName: string) => Promise<AdoTeamMember[]>;
  onSubmit: (payload: CreateAssignmentPayload) => Promise<boolean>;
  defaultContext: AssignmentDefaultContext;
  triggerClassName?: string;
};

type LoadState<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; value: T }
  | { kind: "error"; message: string };

function PlaceholderSpan({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="text-muted-foreground">{children}</span>;
}

function FieldShell({
  label,
  description,
  error,
  children,
  htmlFor,
}: Readonly<{
  label: string;
  description?: string;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}>) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="whitespace-nowrap">{label}</Label>
      <div className="flex-1">{children}</div>
      {description ? (
        <p className="text-muted-foreground text-xs whitespace-nowrap">{description}</p>
      ) : null}
      {error ? <p className="text-destructive text-xs whitespace-nowrap">{error}</p> : null}
    </div>
  );
}

type PersonOption = FormSelectOption & { displayName: string };

function triggerLabelFor(
  selectedIds: string[],
  options: PersonOption[],
): string {
  if (selectedIds.length === 0) return "";
  if (selectedIds.length === 1) {
    return options.find((o) => o.value === selectedIds[0])?.displayName ?? "1 persona";
  }
  return `${selectedIds.length} personas seleccionadas`;
}

export function AssignmentFormDialog({
  catalog,
  roles,
  loadMembers,
  onSubmit,
  lastKnownRoleIdByPerson: _lastKnownRoleIdByPerson,
  defaultContext,
  triggerClassName,
}: AssignmentFormDialogProps) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [pct, setPct] = useState("100");
  const [dateMode, setDateMode] = useState<"month" | "range">("month");
  const [assignedMonth, setAssignedMonth] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validTo, setValidTo] = useState<string>("");
  const [workingDayDecisions, setWorkingDayDecisions] = useState<WorkingDayDecisionDto[]>([]);
  const [members, setMembers] = useState<LoadState<AdoTeamMember[]>>({ kind: "idle" });

  void setDateMode;
  void setAssignedMonth;

  const personOptions: PersonOption[] = useMemo(
    () =>
      members.kind === "ok"
        ? members.value.map((m) => ({
            value: m.id,
            label: m.displayName,
            displayName: m.displayName,
            key: m.id,
          }))
        : [],
    [members],
  );

  const projectOptions: FormSelectOption[] = catalog.projects.map((p) => ({
    value: p.name,
    label: p.name,
    key: p.id,
  }));

  const currentProjectId = catalog.project;
  const teamsForSelectedProject =
    projectName && projectName === currentProjectId ? catalog.teams : [];
  const teamOptions: FormSelectOption[] = teamsForSelectedProject.map((t) => ({
    value: t.name,
    label: t.name,
    key: t.id,
  }));

  const projectLabel =
    catalog.projects.find((p) => p.name === projectName)?.name ?? null;
  const teamLabel =
    teamsForSelectedProject.find((t) => t.name === teamName)?.name ?? null;
  const teamsUnavailableForOtherProject =
    projectName.length > 0 && projectName !== currentProjectId;

  const selectedCount = selectedPersonIds.length;
  const isBulk = selectedCount > 1;
  const requireRole = selectedCount <= 1;

  const reset = useCallback(() => {
    const matchedProject = defaultContext.project
      ? catalog.projects.find((p) => p.name === defaultContext.project!.name)
      : undefined;
    setProjectId(matchedProject?.id ?? "");
    setProjectName(matchedProject?.name ?? defaultContext.project?.name ?? currentProjectId);

    const matchedTeam = defaultContext.team
      ? catalog.teams.find((t) => t.name === defaultContext.team!.name)
      : undefined;
    setTeamId(matchedTeam?.id ?? "");
    setTeamName(matchedTeam?.name ?? defaultContext.team?.name ?? "");

    setSelectedPersonIds([]);
    setPct("100");
    setValidFrom("");
    setValidTo("");
    setWorkingDayDecisions([]);
    setError(null);
    setMembers({ kind: "idle" });
  }, [catalog.projects, catalog.teams, defaultContext, currentProjectId]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) reset();
    },
    [reset],
  );

  useEffect(() => {
    if (!open) return;
    if (!teamName || teamsUnavailableForOtherProject) {
      setMembers({ kind: "idle" });
      return;
    }
    setMembers({ kind: "loading" });
    loadMembers(projectName, teamName)
      .then((value) => setMembers({ kind: "ok", value }))
      .catch((cause: unknown) =>
        setMembers({
          kind: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar los miembros del equipo.",
        }),
      );
  }, [
    open,
    projectName,
    teamName,
    teamsUnavailableForOtherProject,
    loadMembers,
  ]);

  function onSelectProject(value: string) {
    setProjectName(value);
    const found = catalog.projects.find((p) => p.name === value);
    setProjectId(found?.id ?? "");
    setTeamId("");
    setTeamName("");
    setSelectedPersonIds([]);
  }

  function onSelectTeam(value: string) {
    setTeamName(value);
    const found = teamsForSelectedProject.find((t) => t.name === value);
    setTeamId(found?.id ?? "");
    setSelectedPersonIds([]);
  }

  function togglePerson(id: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function clearPersons() {
    setSelectedPersonIds([]);
  }

  function toggleAllPersons() {
    if (members.kind !== "ok") return;
    const allIds = members.value.map((m) => m.id);
    setSelectedPersonIds((prev) =>
      prev.length === allIds.length ? [] : allIds,
    );
  }

  const allPersonsSelected =
    members.kind === "ok" &&
    selectedPersonIds.length === members.value.length &&
    members.value.length > 0;

  const triggerText = triggerLabelFor(selectedPersonIds, personOptions);

  const hasValidPct =
    pct.trim() !== "" &&
    Number.isInteger(Number(pct)) &&
    Number(pct) >= 1 &&
    Number(pct) <= 100;
  const hasValidDates = Boolean(validFrom) && (!validTo || validTo >= validFrom);

  const canSubmit = Boolean(
    projectId &&
    selectedCount > 0 &&
    hasValidPct &&
    hasValidDates,
  );

  const onSave = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const ids = selectedPersonIds;
    const firstId = ids[0];
    const firstDisplayName =
      members.kind === "ok"
        ? members.value.find((m) => m.id === firstId)?.displayName ?? ""
        : "";

    const ok = await onSubmit({
      personAdoId: firstId,
      personDisplayName: firstDisplayName,
      personAdoIds: ids,
      projectId,
      projectName,
      teamId: teamId || null,
      teamName: teamName || null,
      assignmentPct: Number(pct),
      assignedMonth: assignedMonth || null,
      validFrom,
      validTo: validTo ? validTo : null,
      workingDayDecisions,
    });
    setSubmitting(false);
    if (ok) {
      const msg =
        ids.length > 1
          ? `Asignación creada para ${ids.length} personas.`
          : "Asignación creada correctamente.";
      appToast.success(msg);
      setOpen(false);
    } else {
      setError(ASSIGNMENT_USER_MESSAGES.conflictProject);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" className={cn("gap-1.5", triggerClassName)}>
            <Plus className="size-4" aria-hidden />
            Nueva asignación
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva asignación</DialogTitle>
          <DialogDescription>
            Selecciona una o varias personas del equipo para crear la asignación.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
            <FieldShell label="Proyecto" htmlFor={`${formId}-project`}>
              <ControlledSelectField
                label=""
                value={projectName || ""}
                placeholder="Selecciona un proyecto"
                options={projectOptions}
                disabled={submitting}
                displayValue={
                  projectLabel ?? <PlaceholderSpan>Selecciona un proyecto</PlaceholderSpan>
                }
                triggerTitle={projectLabel ?? undefined}
                onValueChange={(value) => {
                  if (!value) return;
                  onSelectProject(value);
                }}
              />
            </FieldShell>

            <FieldShell label="Equipo" htmlFor={`${formId}-team`}>
              <ControlledSelectField
                label=""
                value={teamName || ""}
                placeholder={
                  !projectName
                    ? "Selecciona un proyecto primero"
                    : teamsUnavailableForOtherProject
                      ? "Cambia el proyecto desde el contexto"
                      : "Selecciona un equipo"
                }
                options={teamOptions}
                disabled={
                  submitting || !projectName || teamsUnavailableForOtherProject
                }
                displayValue={
                  teamLabel ??
                  (projectName ? (
                    teamsUnavailableForOtherProject ? (
                      <PlaceholderSpan>Equipos no disponibles</PlaceholderSpan>
                    ) : (
                      <PlaceholderSpan>Selecciona un equipo</PlaceholderSpan>
                    )
                  ) : (
                    <PlaceholderSpan>Selecciona un proyecto primero</PlaceholderSpan>
                  ))
                }
                triggerTitle={teamLabel ?? undefined}
                itemTextWrap
                emptyMessage={
                  teamsUnavailableForOtherProject
                    ? "No hay equipos disponibles en este proyecto de la sesión actual."
                    : "No hay equipos registrados para este proyecto."
                }
                onValueChange={(value) => {
                  if (!value) return;
                  onSelectTeam(value);
                }}
              />
              {teamsUnavailableForOtherProject ? (
                <p className="text-muted-foreground text-xs">
                  Solo podemos listar los equipos del proyecto activo de tu sesión.
                  Vuelve al contexto arriba si necesitas cambiar de proyecto.
                </p>
              ) : null}
            </FieldShell>
          </div>

          <FieldShell
            label="Personas"
            htmlFor={`${formId}-persons`}
          >
            <PersonMultiSelect
              id={`${formId}-persons`}
              options={personOptions}
              selectedIds={selectedPersonIds}
              onToggle={togglePerson}
              onClear={clearPersons}
              onSelectAll={toggleAllPersons}
              allSelected={allPersonsSelected}
              disabled={submitting || !teamName || members.kind === "loading"}
              loading={members.kind === "loading"}
              blockedTeamsForOtherProject={teamsUnavailableForOtherProject}
              emptyMessage="No hay miembros en este equipo."
              triggerText={triggerText}
            />
            {members.kind === "error" ? (
              <p className="text-destructive text-xs">{members.message}</p>
            ) : null}
          </FieldShell>

          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
            <FieldShell label="Mes" htmlFor={`${formId}-assigned-month`}>
              <Input
                id={`${formId}-assigned-month`}
                type="month"
                value={assignedMonth}
                onChange={(e) => setAssignedMonth(e.target.value)}
                disabled={submitting || dateMode === "range"}
                className="font-mono"
              />
            </FieldShell>

            <FieldShell
              label="% Asignación"
              htmlFor={`${formId}-pct`}
              error={
                pct.trim() !== "" &&
                (!Number.isInteger(Number(pct)) || Number(pct) < 1 || Number(pct) > 100)
                  ? "Entero entre 1 y 100"
                  : null
              }
            >
              <Input
                id={`${formId}-pct`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                disabled={submitting}
              />
            </FieldShell>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
            <FieldShell label="Fecha inicio" htmlFor={`${formId}-valid-from`}>
              <DatePicker
                id={`${formId}-valid-from`}
                value={validFrom}
                onChange={setValidFrom}
                disabled={submitting}
              />
            </FieldShell>

            <FieldShell
              label="Fecha fin"
              htmlFor={`${formId}-valid-to`}
            >
              <DatePicker
                id={`${formId}-valid-to`}
                value={validTo}
                onChange={setValidTo}
                min={validFrom}
                disabled={submitting}
              />
            </FieldShell>
          </div>

          {validTo ? (
            <FieldShell label="Días hábiles" htmlFor={`${formId}-working-days`}>
              <WorkingDayDecisionsPanel
                fromIso={validFrom}
                toIso={validTo}
                decisions={workingDayDecisions}
                onDecisionsChange={setWorkingDayDecisions}
              />
            </FieldShell>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={submitting} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              onSave().catch(() => undefined);
            }}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : isBulk ? (
              <Users className="size-4" aria-hidden />
            ) : null}
            {isBulk ? `Asignar a ${selectedCount}` : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PersonMultiSelectProps = Readonly<{
  id: string;
  options: PersonOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
  disabled: boolean;
  loading: boolean;
  blockedTeamsForOtherProject: boolean;
  emptyMessage: string;
  triggerText: string;
}>;

function PersonMultiSelect({
  id,
  options,
  selectedIds,
  onToggle,
  onClear,
  onSelectAll,
  allSelected,
  disabled,
  loading,
  blockedTeamsForOtherProject,
  emptyMessage,
  triggerText,
}: PersonMultiSelectProps) {
  const anchor = useComboboxAnchor();
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.value)),
    [options, selectedSet],
  );
  const placeholder = disabled
    ? blockedTeamsForOtherProject
      ? "Equipos no disponibles en este proyecto"
      : "Selecciona un equipo primero"
    : loading
      ? "Cargando miembros…"
      : "Selecciona una o más personas";

  return (
    <Combobox<PersonOption, true>
      open={open}
      onOpenChange={setOpen}
      items={options}
      value={selectedOptions}
      itemToStringLabel={(option) => option.displayName}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={disabled}
      onValueChange={(nextValue) => {
        const nextArray: PersonOption[] = Array.isArray(nextValue)
          ? nextValue
          : nextValue
            ? [nextValue]
            : [];
        const nextIds = new Set(nextArray.map((o) => o.value));
        const previousIds = new Set(selectedIds);
        for (const id of previousIds) {
          if (!nextIds.has(id)) onToggle(id);
        }
        for (const option of nextArray) {
          if (!previousIds.has(option.value)) onToggle(option.value);
        }
      }}
    >
      <ComboboxTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full min-w-0 justify-between font-normal data-[empty=true]:text-muted-foreground"
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {triggerText ? (
                triggerText
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </Button>
        }
      />

      <ComboboxContent anchor={anchor} className="w-80">
        <div className="flex items-center justify-between gap-2 border-b p-2">
          <ComboboxInput
            placeholder="Buscar persona…"
            showTrigger={false}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || options.length === 0}
            onClick={onSelectAll}
          >
            {allSelected ? "Ninguna" : `Todas (${options.length})`}
          </Button>
        </div>
        <ComboboxList>
          <ComboboxValue>{() => null}</ComboboxValue>
          <ComboboxCollection>
            {(option: PersonOption) => {
              const selected = selectedSet.has(option.value);
              return (
                <ComboboxItem
                  key={option.value}
                  value={option}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "text-primary size-4 shrink-0 transition-opacity",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{option.label}</span>
                </ComboboxItem>
              );
            }}
          </ComboboxCollection>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        </ComboboxList>
        <div className="flex items-center justify-end gap-2 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled || selectedIds.length === 0}
          >
            <X className="size-3" aria-hidden />
            Limpiar
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Aceptar
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  );
}
