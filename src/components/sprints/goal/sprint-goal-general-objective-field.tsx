"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SprintGoalGeneralObjectiveFieldProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function SprintGoalGeneralObjectiveField({
  value,
  disabled = false,
  onChange,
}: SprintGoalGeneralObjectiveFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="sprint-general-objective" className="text-xs">
        Objetivo general
      </Label>
      <Textarea
        id="sprint-general-objective"
        lang="es"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe el objetivo general del sprint (opcional)…"
        disabled={disabled}
        rows={3}
        maxLength={2000}
      />
      <p className="text-muted-foreground text-xs">
        Resumen opcional del foco del sprint para todo el equipo.
      </p>
    </div>
  );
}
