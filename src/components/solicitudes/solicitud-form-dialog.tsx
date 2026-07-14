"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { useSolicitudForm } from "@/hooks/solicitudes/use-solicitud-form";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudFormConfig = Readonly<{
  projects: readonly string[];
  defaultProject: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  isManagement: boolean;
  onCreated: (solicitud: SolicitudDto) => void;
}>;

const UNIT_OPTIONS = [
  { value: "horas", label: "Horas" },
  { value: "dias", label: "Días" },
];

type SolicitudFormBodyProps = Readonly<{
  config: SolicitudFormConfig;
  onClose: () => void;
}>;

function SolicitudFormBody({ config, onClose }: SolicitudFormBodyProps) {
  const form = useSolicitudForm({
    projects: config.projects,
    defaultProject: config.defaultProject,
    currentUserDisplayName: config.currentUserDisplayName,
    holidayKeys: config.holidayKeys,
    onCreated: config.onCreated,
  });

  const { values, fields, catalog } = form;
  const options = catalog.options;

  const projectOptions = config.projects.map((project) => ({ value: project, label: project }));
  const teamOptions = form.teams.map((team) => ({ value: team, label: team }));
  const newsStoryOptions = form.newsStories.map((story) => ({
    value: String(story.workItemId),
    label: story.title,
  }));
  const memberOptions =
    options?.members.map((member) => ({
      value: member.uniqueName,
      label: member.displayName,
    })) ?? [];
  const tipoOptions = options?.tipos.map((tipo) => ({ value: tipo, label: tipo })) ?? [];

  async function handleSubmit() {
    const created = await form.submit();
    if (created) onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva solicitud</DialogTitle>
        <DialogDescription>
          Registra una novedad; se creará como work item en la HU de novedades del proyecto en Azure DevOps.
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-0.5 py-1">
        <ControlledSelectField
          label="Proyecto"
          required
          value={form.project}
          placeholder="Selecciona un proyecto"
          options={projectOptions}
          onValueChange={form.setProject}
        />

        {options?.teamsError ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm">
            <span>No se pudieron cargar los equipos del proyecto.</span>
            <Button type="button" variant="outline" size="sm" onClick={catalog.reload}>
              Reintentar
            </Button>
          </div>
        ) : form.hasTeams ? (
          <ControlledSelectField
            label="Equipo"
            required
            value={form.team}
            placeholder="Selecciona un equipo"
            options={teamOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading}
            onValueChange={form.setTeam}
          />
        ) : null}

        {catalog.error ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm">
            <span>{catalog.error}</span>
            <Button type="button" variant="outline" size="sm" onClick={catalog.reload}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {form.noNewsStories ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium">
              {form.hasTeams
                ? "Este equipo no tiene historias de novedades configuradas."
                : "Este proyecto no tiene historias de novedades configuradas."}
            </p>
            {config.isManagement ? (
              <Link href="/admin/novedades" className="mt-1 inline-block underline underline-offset-2">
                Configurar novedades
              </Link>
            ) : (
              <p className="text-muted-foreground mt-1">
                Pide a un rol de gestión que configure las novedades del proyecto.
              </p>
            )}
          </div>
        ) : (
          <ControlledSelectField
            label="HU de novedades"
            required
            value={values.newsStoryId !== null ? String(values.newsStoryId) : ""}
            placeholder={
              form.hasTeams && !form.team ? "Selecciona un equipo primero" : "Selecciona la HU destino"
            }
            options={newsStoryOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading || (form.hasTeams && !form.team)}
            onValueChange={(value) => fields.setNewsStoryId(Number(value))}
          />
        )}

        <ControlledSelectField
          label="Persona asignada"
          required
          value={values.assignedTo}
          placeholder="Selecciona la persona"
          options={memberOptions}
          loading={catalog.loading}
          disabled={!form.project || catalog.loading}
          onValueChange={fields.setAssignedTo}
        />

        <div className="flex flex-col gap-1.5">
          <ControlledSelectField
            label="Tipo de solicitud"
            required
            value={values.tipo}
            placeholder="Selecciona el tipo"
            options={tipoOptions}
            loading={catalog.loading}
            disabled={!form.project || catalog.loading}
            error={options?.tiposError ? "No se pudieron cargar los tipos desde Azure." : null}
            onValueChange={fields.setTipo}
          />
          {options?.tiposError ? (
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={catalog.reload}>
              Reintentar
            </Button>
          ) : null}
        </div>

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
              value={values.value}
              placeholder="0"
              onChange={(event) => fields.setValue(event.target.value)}
            />
          </div>
          <ControlledSelectField
            label="Unidad"
            value={values.unit}
            placeholder="Unidad"
            options={UNIT_OPTIONS}
            triggerClassName="w-28"
            onValueChange={(value) => fields.setUnit(value === "dias" ? "dias" : "horas")}
          />
        </div>
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
          <Label htmlFor="solicitud-reintegro" required>
            Fecha de reintegro
          </Label>
          <DatePicker
            id="solicitud-reintegro"
            value={values.fechaReintegro}
            min={values.endDate || undefined}
            onChange={fields.setReintegro}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="solicitud-descripcion">Descripción</Label>
          <Textarea
            id="solicitud-descripcion"
            value={values.description}
            maxLength={500}
            placeholder="Detalle opcional de la novedad"
            onChange={(event) => fields.setDescription(event.target.value)}
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

        <FormInlineError message={form.formError} />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="button" onClick={handleSubmit} disabled={!form.canSubmit}>
          {form.submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
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
      <DialogContent className="sm:max-w-lg">
        <SolicitudFormBody config={config} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
