"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { TbTemplate } from "react-icons/tb";

import { DraftCard, type DraftCardVariant } from "@/components/forms/draft-card";
import { PbiSelectComboboxField } from "@/components/time-log/fields/pbi-select-combobox-field";
import { TimeLogBulkRowTemplates } from "@/components/time-log/time-log-bulk-row-templates";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  AdoTaskStateDto,
  AdoWorkItemOptionDto,
} from "@/lib/schemas/ado-catalog";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { applyTemplateToRow } from "@/lib/time-log/apply-template-to-row";
import type { BulkRow } from "@/lib/time-log/bulk-row";
import { parseBulkRowHours } from "@/hooks/time-log/use-bulk-rows";

export type TimeLogBulkRowProps = Readonly<{
  row: BulkRow;
  index: number;
  pbis: readonly AdoWorkItemOptionDto[];
  templates: readonly TimeLogTemplateDto[];
  templatesLoading?: boolean;
  activities: readonly string[];
  taskStates: readonly AdoTaskStateDto[];
  isTaskCreationMode: boolean;
  canRemove: boolean;
  disabled?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (id: string, patch: Partial<BulkRow>) => void;
  onRemove: (id: string) => void;
}>;

function ResultChip({ row }: { row: BulkRow }) {
  if (!row.result) {
    return (
      <span
        className="text-muted-foreground inline-flex items-center gap-1 text-xs"
        aria-live="polite"
      >
        <CircleDashed className="size-3.5" aria-hidden />
        Pendiente
      </span>
    );
  }
  if (row.result.ok) {
    return (
      <span
        className="text-emerald-700 inline-flex items-center gap-1 text-xs font-medium"
        aria-live="polite"
      >
        <CheckCircle2 className="size-3.5" aria-hidden />
        {row.result.taskId ? `Tarea #${row.result.taskId}` : "Creada"}
      </span>
    );
  }
  return (
    <span
      className="text-destructive inline-flex max-w-72 items-start gap-1 text-xs font-medium"
      aria-live="polite"
    >
      <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="line-clamp-3">
        {row.result.message ?? "No se pudo crear."}
      </span>
    </span>
  );
}

function buildRowSummary(
  row: BulkRow,
  pbis: readonly AdoWorkItemOptionDto[],
): string {
  const pbi = pbis.find((item) => String(item.id) === row.pbiId);
  const pbiLabel = pbi ? `#${pbi.id} ${pbi.title}` : null;
  const title = row.taskTitle.trim();
  const hours = (() => {
    const h = parseBulkRowHours(row.hours);
    return h > 0 ? `${h}h` : null;
  })();

  const parts: string[] = [];
  if (pbiLabel) parts.push(pbiLabel);
  if (title) parts.push(title);
  if (hours) parts.push(hours);

  return parts.length > 0 ? parts.join(" · ") : "Borrador";
}

function variantFor(row: BulkRow): DraftCardVariant {
  if (row.result?.ok === true) return "success";
  if (row.result?.ok === false) return "error";
  return "default";
}

export function TimeLogBulkRow({
  row,
  index,
  pbis,
  templates,
  templatesLoading = false,
  activities,
  taskStates,
  isTaskCreationMode,
  canRemove,
  disabled = false,
  isOpen,
  onOpenChange,
  onChange,
  onRemove,
}: TimeLogBulkRowProps) {
  const idPrefix = `bulk-row-${row.id}`;
  const summary = buildRowSummary(row, pbis);
  const variant = variantFor(row);
  const showStatus = row.result !== null;

  return (
    <DraftCard
      id={row.id}
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
      status={showStatus ? <ResultChip row={row} /> : null}
      variant={variant}
      canRemove={canRemove}
      onRemove={() => onRemove(row.id)}
      disabled={disabled}
    >
      {/* Plantilla — primero como en Individual */}
      <div className="space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <TbTemplate className="text-muted-foreground size-3.5" aria-hidden />
          Plantillas
          <span className="text-muted-foreground text-xs font-normal">
            · Escoge una para autocompletar
          </span>
        </span>
        <TimeLogBulkRowTemplates
          templates={templates}
          selectedId={row.templateId}
          disabled={disabled}
          loading={templatesLoading}
          onSelect={(template) => {
            const applied = applyTemplateToRow(template, activities);
            onChange(row.id, {
              templateId: template.id,
              taskTitle: applied.taskTitle,
              description: applied.description,
              activity: applied.activity,
              hours: applied.hours,
            });
          }}
          onClear={() =>
            onChange(row.id, {
              templateId: "",
              taskTitle: "",
              description: "",
              activity: "",
            })
          }
        />
      </div>

      {/* Historia de usuario */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-pbi`}>
          Historia de usuario <span className="text-destructive">*</span>
        </Label>
        <PbiSelectComboboxField
          id={`${idPrefix}-pbi`}
          pbis={pbis}
          value={row.pbiId || null}
          onValueChange={(value) => onChange(row.id, { pbiId: value ?? "" })}
          disabled={disabled}
        />
        {row.errors.pbiId ? (
          <p className="text-destructive text-xs">{row.errors.pbiId}</p>
        ) : null}
      </div>

      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-title`}>
          Título de la tarea <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Ej. Reunión, fix de bug, desarrollo endpoint..."
          value={row.taskTitle}
          disabled={disabled}
          onChange={(event) => onChange(row.id, { taskTitle: event.target.value })}
          aria-invalid={Boolean(row.errors.taskTitle)}
        />
        {row.errors.taskTitle ? (
          <p className="text-destructive text-xs">{row.errors.taskTitle}</p>
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
            value={row.hours}
            disabled={disabled}
            onChange={(event) => onChange(row.id, { hours: event.target.value })}
            aria-invalid={Boolean(row.errors.hours)}
          />
          {row.errors.hours ? (
            <p className="text-destructive text-xs">{row.errors.hours}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-activity`}>Actividad</Label>
          <Select
            value={row.activity || null}
            onValueChange={(value) => onChange(row.id, { activity: value ?? "" })}
            disabled={disabled}
          >
            <SelectTrigger id={`${idPrefix}-activity`}>
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
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-description`}>
          Descripción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={3}
          placeholder="Describe brevemente lo realizado en esta tarea"
          value={row.description}
          disabled={disabled}
          onChange={(event) =>
            onChange(row.id, { description: event.target.value })
          }
          className="resize-none"
          aria-invalid={Boolean(row.errors.description)}
        />
        {row.errors.description ? (
          <p className="text-destructive text-xs">{row.errors.description}</p>
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
          dateValue={row.workingDate}
          timeValue={row.workingTime}
          onDateChange={(value) => onChange(row.id, { workingDate: value })}
          onTimeChange={(value) => onChange(row.id, { workingTime: value })}
          disabled={disabled}
        />
        {row.errors.workingDate || row.errors.workingTime ? (
          <p className="text-destructive text-xs">
            {row.errors.workingDate ?? row.errors.workingTime}
          </p>
        ) : null}
      </div>

      {/* Estado y mark-as-done — sólo si task creation mode */}
      {isTaskCreationMode ? (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-state`}>Estado inicial</Label>
            <Select
              value={row.taskState || null}
              onValueChange={(value) =>
                onChange(row.id, { taskState: value ?? "" })
              }
              disabled={disabled || row.markAsDone}
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
              checked={row.markAsDone}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange(row.id, { markAsDone: Boolean(checked) })
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
