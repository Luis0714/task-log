"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopilotPbiTypeahead } from "@/components/copilot/copilot-pbi-typeahead";
import { cn } from "@/lib/utils";
import type { CreateTaskBatchItem, PbiCandidate } from "@/lib/schemas/agent";

export type CopilotTaskRowProps = {
  task: CreateTaskBatchItem;
  sprintPath: string;
  activities: readonly string[];
  stateNames: readonly string[];
  onChange: (task: CreateTaskBatchItem) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function CopilotTaskRow({
  task,
  sprintPath,
  activities,
  stateNames,
  onChange,
  onRemove,
  disabled = false,
}: Readonly<CopilotTaskRowProps>) {
  const selectedPbi: PbiCandidate = {
    id: task.pbiId,
    title: task.pbiTitle,
  };

  const update = (partial: Partial<CreateTaskBatchItem>) => {
    onChange({ ...task, ...partial });
  };

  return (
    <div className="border-border bg-card space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          id={`${task.title || "task"}-pbi-label`}
          className="text-muted-foreground text-xs font-medium"
        >
          Historia de usuario (PBI)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Quitar task"
          title="Quitar task"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <CopilotPbiTypeahead
        value={task.pbiId > 0 ? selectedPbi : null}
        onChange={(pbi) =>
          update({
            pbiId: pbi.id,
            pbiTitle: pbi.title,
          })
        }
        sprintPath={sprintPath}
        disabled={disabled}
      />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Título de la task">
            <Input
              value={task.title}
              onChange={(e) => update({ title: e.target.value })}
              disabled={disabled}
              placeholder="Ej: Bug del login — corregir validación"
            />
          </Field>
        </div>
        <div className="w-24 shrink-0">
          <Field label="Horas">
            <Input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              value={task.hours}
              onChange={(e) => update({ hours: Number(e.target.value) })}
              disabled={disabled}
            />
          </Field>
        </div>
      </div>

      <Field label="Descripción">
        <Textarea
          value={task.description}
          onChange={(e) => update({ description: e.target.value })}
          disabled={disabled}
          rows={2}
          placeholder="¿Qué hiciste exactamente?"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fecha">
          <Input
            type="date"
            value={task.workingDate}
            onChange={(e) => update({ workingDate: e.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field label="Hora">
          <Input
            type="time"
            value={task.workingTime}
            onChange={(e) => update({ workingTime: e.target.value })}
            disabled={disabled}
          />
        </Field>
      </div>

      <div
        className={cn(
          "grid gap-3",
          activities.length > 0 && stateNames.length > 0
            ? "sm:grid-cols-2"
            : "sm:grid-cols-1",
        )}
      >
        {activities.length > 0 ? (
          <Field label="Actividad">
            <Select
              value={task.activity}
              onValueChange={(value) => value && update({ activity: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona actividad" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field label="Estado final">
          <Select
            value={task.state}
            onValueChange={(value) => value && update({ state: value })}
            disabled={disabled || stateNames.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  stateNames.length > 0 ? "Estado" : "Estados no disponibles"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {stateNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
