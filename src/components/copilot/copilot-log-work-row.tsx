"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LogWorkItem } from "@/lib/schemas/agent";

export type CopilotLogWorkRowProps = {
  item: LogWorkItem;
  onChange: (item: LogWorkItem) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function CopilotLogWorkRow({
  item,
  onChange,
  onRemove,
  disabled = false,
}: Readonly<CopilotLogWorkRowProps>) {
  return (
    <div className="border-border bg-card space-y-3 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Work item ID
          </label>
          <Input
            type="number"
            min={1}
            value={item.workItemId || ""}
            onChange={(e) =>
              onChange({
                ...item,
                workItemId: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            disabled={disabled}
            placeholder="123"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Quitar item"
          className="mt-6"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      <Field label="Horas">
        <Input
          type="number"
          min={0.5}
          max={24}
          step={0.5}
          value={item.hours}
          onChange={(e) =>
            onChange({ ...item, hours: Number.parseFloat(e.target.value) || 0 })
          }
          disabled={disabled}
        />
      </Field>

      <Field label="Comentario">
        <Textarea
          value={item.comment}
          onChange={(e) => onChange({ ...item, comment: e.target.value })}
          disabled={disabled}
          rows={2}
          placeholder="¿Qué hiciste?"
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