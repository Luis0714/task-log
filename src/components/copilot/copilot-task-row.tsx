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
import type {
  CreateTaskBatchItem,
  PbiCandidate,
} from "@/lib/schemas/agent";

const ACTIVITY_OPTIONS = [
  { value: "Development", label: "Development" },
  { value: "QA", label: "QA" },
  { value: "Code review", label: "Code review" },
  { value: "Design", label: "Design" },
  { value: "Documentation", label: "Documentation" },
  { value: "Meeting", label: "Meeting" },
] as const;

const STATE_OPTIONS = [
  { value: "Closed", label: "Done" },
  { value: "Active", label: "Active" },
  { value: "Proposed", label: "Proposed" },
  { value: "Resolved", label: "Resolved" },
] as const;

export type CopilotTaskRowProps = {
  task: CreateTaskBatchItem;
  sprintPath: string;
  onChange: (task: CreateTaskBatchItem) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function CopilotTaskRow({
  task,
  sprintPath,
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Historia de usuario (PBI)
          </label>
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
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Quitar task"
          className="mt-6"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Fecha">
          <Input
            type="date"
            value={task.workingDate}
            onChange={(e) => update({ workingDate: e.target.value })}
            disabled={disabled}
          />
        </Field>
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
        <Field label="Hora">
          <Input
            type="time"
            value={task.workingTime}
            onChange={(e) => update({ workingTime: e.target.value })}
            disabled={disabled}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
              {ACTIVITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Estado final">
          <Select
            value={task.state}
            onValueChange={(value) => value && update({ state: value })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Título de la task">
        <Input
          value={task.title}
          onChange={(e) => update({ title: e.target.value })}
          disabled={disabled}
          placeholder="Ej: Bug del login — corregir validación"
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          value={task.description}
          onChange={(e) => update({ description: e.target.value })}
          disabled={disabled}
          rows={2}
          placeholder="¿Qué hiciste exactamente?"
        />
      </Field>
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