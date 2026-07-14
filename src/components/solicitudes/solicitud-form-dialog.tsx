"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { RichTextarea } from "@/components/ui/rich-textarea-lazy";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { useSolicitudForm, type SolicitudFormMode } from "@/hooks/solicitudes/use-solicitud-form";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudFormConfig = Readonly<{
  projects: readonly string[];
  defaultProject: string;
  defaultTeam: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  isManagement: boolean;
  /** `create` registra una nueva; `edit` requiere `initialSolicitud`. */
  mode: SolicitudFormMode;
  initialSolicitud?: SolicitudDto;
  /** Notifica al shell tras crear/editar correctamente. */
  onSaved: (solicitud: SolicitudDto) => void;
}>;

const UNIT_OPTIONS = [
  { value: "horas", label: "Horas" },
  { value: "dias", label: "Días" },
];

type SolicitudFormBodyProps = Readonly<{
  config: SolicitudFormConfig;
  onClose: () => void;
}>;

function resolveStatePlaceholder(
  isLoading: boolean,
  hasOptions: boolean,
): string {
  if (isLoading) return "Cargando estados…";
  if (!hasOptions) return "Sin estados disponibles";
  return "Selecciona el estado";
}

function resolveSubmitLabel(submitting: boolean, isEdit: boolean): string {
  if (submitting) return isEdit ? "Guardando…" : "Creando…";
  return isEdit ? "Guardar cambios" : "Crear solicitud";
}

function useFormSelectOptions(config: SolicitudFormConfig, form: ReturnType<typeof useSolicitudForm>) {
  const { values, fields, catalog, mode } = form;
  const isEdit = mode === "edit";
  const projectOptions = config.projects.map((project) => ({
    value: project,
    label: project,
  }));
  const teamOptions = form.teams.map((team) => ({ value: team, label: team }));
  const newsStoryOptions = form.newsStories.map((story) => ({
    value: String(story.workItemId),
    label: `#${story.workItemId} · ${story.title}`,
  }));
  const memberOptions = form.teamScopedMembers.map((member) => ({
    value: member.uniqueName,
    label: member.displayName,
  }));
  const tipoOptions = (catalog.options?.tipos ?? []).map((tipo) => ({
    value: tipo,
    label: tipo,
  }));
  const stateOptions = [...(catalog.options?.states ?? []).map((state) => ({
    value: state,
    label: state,
  }))];
  // Si el estado actual no viene del catálogo (legacy / estado creado en otra
  // sesión), lo añadimos como opción para que el select lo muestre en lugar
  // de quedar vacío.
  if (values.state && !stateOptions.some((opt) => opt.value === values.state)) {
    stateOptions.unshift({ value: values.state, label: values.state });
  }
  return {
    values,
    fields,
    catalog,
    isEdit,
    projectOptions,
    teamOptions,
    newsStoryOptions,
    memberOptions,
    tipoOptions,
    stateOptions,
  };
}

function SolicitudFormBody({ config, onClose }: SolicitudFormBodyProps) {
  const form = useSolicitudForm({
    mode: config.mode,
    projects: config.projects,
    defaultProject: config.defaultProject,
    defaultTeam: config.defaultTeam,
    currentUserDisplayName: config.currentUserDisplayName,
    holidayKeys: config.holidayKeys,
    ...(config.mode === "edit" && config.initialSolicitud
      ? { initialSolicitud: config.initialSolicitud }
      : {}),
    onSaved: config.onSaved,
  });

  const { values, fields, catalog, isEdit, projectOptions, teamOptions, newsStoryOptions, memberOptions, tipoOptions, stateOptions } =
    useFormSelectOptions(config, form);

  const selectedNewsStoryTitle = newsStoryOptions.find(
    (opt) =>
      opt.value ===
      (form.values.newsStoryId !== null ? String(form.values.newsStoryId) : ""),
  )?.label;
  const selectedMemberLabel = memberOptions.find(
    (opt) => opt.value === form.values.assignedTo,
  )?.label;

  async function handleSubmit() {
    const ok = await form.submit();
    if (ok) onClose();
  }

  const options = catalog.options;
  const statePlaceholder = resolveStatePlaceholder(catalog.loading, stateOptions.length > 0);
  const submitLabel = resolveSubmitLabel(form.submitting, isEdit);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar solicitud" : "Nueva solicitud"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Actualiza la novedad; los cambios se guardan sobre el mismo work item en Azure DevOps."
            : "Registra una novedad; se creará como work item en la HU de novedades del proyecto en Azure DevOps."}
        </DialogDescription>
      </DialogHeader>

      <div className="no-scrollbar flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-0.5 py-1">
        <ControlledSelectField
          label="Proyecto"
          required
          value={form.project}
          placeholder="Selecciona un proyecto"
          options={projectOptions}
          onValueChange={form.setProject}
        />

        {options?.teamsError ? (
          <RetryAlert
            message="No se pudieron cargar los equipos del proyecto."
            onRetry={catalog.reload}
          />
        ) : (
          <ControlledSelectField
            label="Equipo"
            required={form.hasTeams}
            value={form.team}
            placeholder="Selecciona un equipo"
            options={teamOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading}
            emptyMessage="Este proyecto no tiene equipos."
            onValueChange={form.setTeam}
          />
        )}

        {catalog.error ? (
          <RetryAlert message={catalog.error} onRetry={catalog.reload} />
        ) : null}

        {form.noNewsStories ? (
          <NoNewsStoriesAlert
            hasTeams={form.hasTeams}
            isManagement={config.isManagement}
          />
        ) : (
          <ControlledSelectField
            label="HU de novedades"
            required
            value={values.newsStoryId !== null ? String(values.newsStoryId) : ""}
            placeholder={
              form.hasTeams && !form.team
                ? "Selecciona un equipo primero"
                : "Selecciona la HU destino"
            }
            options={newsStoryOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading || (form.hasTeams && !form.team)}
            displayValue={selectedNewsStoryTitle}
            onValueChange={(value) => fields.setNewsStoryId(Number(value))}
          />
        )}

        <SelectFieldWithRetry
          label="Persona asignada"
          required
          value={values.assignedTo}
          placeholder="Selecciona la persona"
          options={memberOptions}
          loading={catalog.loading}
          disabled={!form.project || catalog.loading}
          displayValue={selectedMemberLabel}
          errorMessage={
            options?.membersError && memberOptions.length === 0
              ? "No se pudieron cargar los miembros del proyecto."
              : null
          }
          onValueChange={fields.setAssignedTo}
          onRetry={catalog.reload}
        />

        <SelectFieldWithRetry
          label="Tipo de solicitud"
          required
          value={values.tipo}
          placeholder="Selecciona el tipo"
          options={tipoOptions}
          loading={catalog.loading}
          disabled={!form.project || catalog.loading}
          errorMessage={options?.tiposError ? "No se pudieron cargar los tipos desde Azure." : null}
          onValueChange={fields.setTipo}
          onRetry={catalog.reload}
        />

        {isEdit ? (
          <SelectFieldWithRetry
            label="Estado"
            value={values.state}
            placeholder={statePlaceholder}
            options={stateOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading}
            errorMessage={
              options?.statesError ? "No se pudieron cargar los estados desde Azure." : null
            }
            onValueChange={fields.setState}
            onRetry={catalog.reload}
          />
        ) : null}

        <TiempoRow
          value={values.value}
          unit={values.unit}
          onValueChange={fields.setValue}
          onUnitChange={fields.setUnit}
        />

        <FormInlineError message={form.durationError} />

        <div className="flex flex-col gap-1.5">
          <Label required>Fecha y hora de inicio</Label>
          <DatePickerTime
            dateValue={values.startDate}
            timeValue={values.startTime}
            onDateChange={fields.setStartDate}
            onTimeChange={fields.setStartTime}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Fecha y hora de fin</Label>
          <DatePickerTime
            dateValue={values.endDate}
            timeValue={values.endTime}
            min={values.startDate || undefined}
            onDateChange={fields.setEndDate}
            onTimeChange={fields.setEndTime}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Fecha y hora de reintegro</Label>
          <DatePickerTime
            dateId="solicitud-reintegro"
            timeId="solicitud-reintegro-hora"
            dateValue={values.fechaReintegro}
            timeValue={values.reintegroTime}
            min={values.endDate || undefined}
            onDateChange={fields.setReintegro}
            onTimeChange={fields.setReintegroTime}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="solicitud-titulo" required>
            Título
          </Label>
          <Input
            id="solicitud-titulo"
            value={form.title}
            maxLength={150}
            onChange={(event) => fields.setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="solicitud-descripcion">Descripción</Label>
          <RichTextarea
            value={values.description}
            onChange={fields.setDescription}
            placeholder="Detalle opcional de la novedad"
          />
        </div>

        <FormInlineError message={form.formError} />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="button" onClick={handleSubmit} disabled={!form.canSubmit}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

function RetryAlert({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm">
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function NoNewsStoriesAlert({
  hasTeams,
  isManagement,
}: Readonly<{ hasTeams: boolean; isManagement: boolean }>) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">
        {hasTeams
          ? "Este equipo no tiene historias de novedades configuradas."
          : "Este proyecto no tiene historias de novedades configuradas."}
      </p>
      {isManagement ? (
        <Link href="/admin/novedades" className="mt-1 inline-block underline underline-offset-2">
          Configurar novedades
        </Link>
      ) : (
        <p className="text-muted-foreground mt-1">
          Pide a un rol de gestión que configure las novedades del proyecto.
        </p>
      )}
    </div>
  );
}

type SelectFieldWithRetryProps = Readonly<{
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: ReactNode; key?: string }>;
  loading: boolean;
  disabled: boolean;
  displayValue?: string;
  errorMessage?: string | null;
  onValueChange: (value: string) => void;
  onRetry: () => void;
}>;

function SelectFieldWithRetry(props: SelectFieldWithRetryProps) {
  const error = props.errorMessage ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <ControlledSelectField
        label={props.label}
        required={props.required}
        value={props.value}
        placeholder={props.placeholder}
        options={props.options as Array<{ value: string; label: ReactNode; key?: string }>}
        loading={props.loading}
        disabled={props.disabled}
        displayValue={props.displayValue}
        error={error}
        onValueChange={props.onValueChange}
      />
      {error ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={props.onRetry}
        >
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

function TiempoRow({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: Readonly<{
  value: string;
  unit: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: "horas" | "dias") => void;
}>) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="solicitud-tiempo" required>
          Tiempo
        </Label>
        <Input
          id="solicitud-tiempo"
          type="number"
          min={0}
          step="0.5"
          value={value}
          placeholder="0"
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>
      <ControlledSelectField
        label="Unidad"
        value={unit}
        placeholder="Unidad"
        options={UNIT_OPTIONS}
        triggerClassName="w-28"
        onValueChange={(next) => onUnitChange(next === "dias" ? "dias" : "horas")}
      />
    </div>
  );
}

export type SolicitudFormDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SolicitudFormConfig;
}>;

export function SolicitudFormDialog({ open, onOpenChange, config }: SolicitudFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <SolicitudFormBody config={config} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
