"use client";

import { CheckCircle2, CircleDashed, Plus, XCircle } from "lucide-react";
import { TbTemplate } from "react-icons/tb";

import { DraftCard, type DraftCardVariant } from "@/components/forms/draft-card";
import { SaveAsTemplateDialog } from "@/components/time-log/save-as-template-dialog";
import { TimeLogBulkRowTemplates } from "@/components/time-log/time-log-bulk-row-templates";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextarea } from "@/components/ui/rich-textarea";
import type {
  AdoTaskStateDto,
} from "@/lib/schemas/ado-catalog";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { applyTemplateToRow } from "@/lib/time-log/apply-template-to-row";
import type { BulkTask } from "@/lib/time-log/bulk-group";
import { cn } from "@/lib/utils";

export type TimeLogBulkTaskProps = Readonly<{
  task: BulkTask;
  index: number;
  templates: readonly TimeLogTemplateDto[];
  templatesLoading?: boolean;
  templatesError?: string | null;
  activities: readonly string[];
  taskStates: readonly AdoTaskStateDto[];
  isTaskCreationMode: boolean;
  canRemove: boolean;
  disabled?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<BulkTask>) => void;
  onRemove: () => void;
}>;

function ResultChip({ task }: { readonly task: BulkTask }) {
  if (!task.result) return null;
  if (task.result.ok) {
    return (
      <span
        className="text-emerald-600"
        aria-live="polite"
        aria-label="Tarea creada"
      >
        <CheckCircle2 className="size-3.5" aria-hidden />
      </span>
    );
  }
  const isSkipped = task.result.message?.startsWith("No enviado");
  return (
    <span
      className={cn(
        isSkipped ? "text-muted-foreground" : "text-destructive",
      )}
      aria-live="polite"
      aria-label={isSkipped ? "Tarea omitida" : "Error al crear"}
    >
      {isSkipped ? (
        <CircleDashed className="size-3.5" aria-hidden />
      ) : (
        <XCircle className="size-3.5" aria-hidden />
      )}
    </span>
  );
}

function buildTaskSummary(task: BulkTask): string {
  const title = task.taskTitle.trim();
  const hours = (() => {
    const parsed = Number.parseFloat(task.hours.replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? `${parsed}h` : null;
  })();

  const parts: string[] = [];
  if (title) parts.push(title);
  if (hours) parts.push(hours);

  return parts.length > 0 ? parts.join(" · ") : "Borrador";
}

function variantFor(task: BulkTask): DraftCardVariant {
  if (task.result?.ok === true) return "success";
  if (task.result?.ok === false) return "error";
  return "default";
}

export function TimeLogBulkTask({
  task,
  index,
  templates,
  templatesLoading = false,
  templatesError = null,
  activities,
  taskStates,
  isTaskCreationMode,
  canRemove,
  disabled = false,
  isOpen,
  onOpenChange,
  onChange,
  onRemove,
}: TimeLogBulkTaskProps) {
  const idPrefix = `bulk-task-${task.id}`;
  const summary = buildTaskSummary(task);
  const variant = variantFor(task);
  const showStatus = task.result !== null;
  const selectedTemplate =
    templates.find((t) => t.id === task.templateId) ?? null;

  return (
    <DraftCard
      id={task.id}
      index={index}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      summary={
        <span
          className={cn(
            "truncate",
            summary === "Borrador" && "text-muted-foreground italic",
          )}
        >
          {summary}
        </span>
      }
      status={showStatus ? <ResultChip task={task} /> : null}
      variant={variant}
      canRemove={canRemove}
      onRemove={onRemove}
      disabled={disabled}
      triggerLabel={`Tarea ${index + 1}`}
    >
      {/* Plantilla — primero como en Individual */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <TbTemplate className="text-muted-foreground size-3.5" aria-hidden />
            Plantillas
            <span className="text-muted-foreground text-xs font-normal">
              · Escoge una para autocompletar
            </span>
          </span>
          <SaveAsTemplateDialog
            defaultTitle={task.taskTitle}
            defaultDescription={task.description}
            defaultActivity={task.activity}
            defaultHours={task.hours}
            activities={activities}
            disabled={disabled}
          >
            <Plus className="size-4" aria-hidden />
          </SaveAsTemplateDialog>
        </div>
        <TimeLogBulkRowTemplates
          templates={templates}
          selectedId={task.templateId}
          disabled={disabled}
          loading={templatesLoading}
          error={templatesError}
          selectedTemplate={selectedTemplate}
          defaultTitle={task.taskTitle}
          defaultDescription={task.description}
          defaultActivity={task.activity}
          defaultHours={task.hours}
          activities={activities}
          onSelect={(template) => {
            const applied = applyTemplateToRow(template, activities);
            onChange({
              templateId: template.id,
              taskTitle: applied.taskTitle,
              description: applied.description,
              activity: applied.activity,
              hours: applied.hours,
            });
          }}
          onClear={() =>
            onChange({
              templateId: "",
              taskTitle: "",
              description: "",
              activity: "",
            })
          }
        />
      </div>

      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-title`}>
          Título de la tarea <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Ej. Reunión, fix de bug, desarrollo endpoint..."
          value={task.taskTitle}
          disabled={disabled}
          onChange={(event) => onChange({ taskTitle: event.target.value })}
          aria-invalid={Boolean(task.errors.taskTitle)}
        />
        {task.errors.taskTitle ? (
          <p className="text-destructive text-xs">{task.errors.taskTitle}</p>
        ) : null}
      </div>

      {/* Horas + Actividad (2 columnas en desktop) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-hours`}>
            Horas <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-hours`}
            inputMode="decimal"
            placeholder="1.5"
            value={task.hours}
            disabled={disabled}
            onChange={(event) => onChange({ hours: event.target.value })}
            aria-invalid={Boolean(task.errors.hours)}
          />
          {task.errors.hours ? (
            <p className="text-destructive text-xs">{task.errors.hours}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-activity`}>
            Actividad <span className="text-destructive">*</span>
          </Label>
          <Select
            value={task.activity || null}
            onValueChange={(value) => onChange({ activity: value ?? "" })}
            disabled={disabled}
          >
            <SelectTrigger
              id={`${idPrefix}-activity`}
              aria-invalid={Boolean(task.errors.activity)}
            >
              <SelectValue placeholder="Selecciona actividad" />
            </SelectTrigger>
            <SelectContent>
              {activities.map((activity) => (
                <SelectItem key={activity} value={activity}>
                  {activity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {task.errors.activity ? (
            <p className="text-destructive text-xs">{task.errors.activity}</p>
          ) : null}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-description`}>
          Descripción <span className="text-destructive">*</span>
        </Label>
        <RichTextarea
          placeholder="Describe brevemente lo realizado en esta tarea"
          value={task.description}
          disabled={disabled}
          onChange={(html) => onChange({ description: html })}
        />
        {task.errors.description ? (
          <p className="text-destructive text-xs">{task.errors.description}</p>
        ) : null}
      </div>

      {/* Fecha y hora */}
      <div className="space-y-1.5">
        <Label>
          Fecha y hora de trabajo <span className="text-destructive">*</span>
        </Label>
        <DatePickerTime
          dateId={`${idPrefix}-date`}
          timeId={`${idPrefix}-time`}
          dateValue={task.workingDate}
          timeValue={task.workingTime}
          onDateChange={(value) => onChange({ workingDate: value })}
          onTimeChange={(value) => onChange({ workingTime: value })}
          disabled={disabled}
        />
        {task.errors.workingDate || task.errors.workingTime ? (
          <p className="text-destructive text-xs">
            {task.errors.workingDate ?? task.errors.workingTime}
          </p>
        ) : null}
      </div>

      {/* Estado y mark-as-done — sólo si task creation mode */}
      {isTaskCreationMode ? (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-state`}>Estado inicial</Label>
            <Select
              value={task.taskState || null}
              onValueChange={(value) => onChange({ taskState: value ?? "" })}
              disabled={disabled || task.markAsDone}
            >
              <SelectTrigger id={`${idPrefix}-state`}>
                <SelectValue placeholder="Estado de la tarea" />
              </SelectTrigger>
              <SelectContent>
                {taskStates.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={task.markAsDone}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ markAsDone: Boolean(checked) })
              }
            />
            <span className="leading-tight">
              <span className="font-medium">Marcar como Done al crear</span>
              <span className="text-muted-foreground block text-xs">
                La tarea pasará a Done y contará de inmediato en las horas del día.
              </span>
            </span>
          </label>
        </div>
      ) : null}
    </DraftCard>
  );
}
