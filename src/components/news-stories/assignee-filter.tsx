"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AssigneeFilterProps = Readonly<{
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}>;

/**
 * Filtro de "Asignado a" — `<input type="text">` que filtra en cliente por
 * coincidencia case/acento-insensitive contra `assignedTo`. Vive en su propio
 * archivo porque la app lo puede reusar (p.ej. en el reporte futuro).
 */
export function AssigneeFilter({
  value,
  onChange,
  disabled,
}: AssigneeFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="reported-news-assignee" className="text-xs font-medium">
        Asignado a
      </Label>
      <Input
        id="reported-news-assignee"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre…"
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className="w-60"
      />
    </div>
  );
}
