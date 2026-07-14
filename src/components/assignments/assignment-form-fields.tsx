"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";

import { Loader2 } from "lucide-react";

import { isPctValueValid } from "@/components/assignments/editable-cells";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";

/** Subtítulo de sección dentro de los modales de asignación. */
export function SectionLabel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-muted-foreground sm:col-span-2 text-xs font-semibold uppercase tracking-wide">
      {children}
    </p>
  );
}

/**
 * Slider de porcentaje sincronizado con su input numérico.
 * Muestra el valor en vivo, errores inline y se deshabilita junto al resto
 * del formulario durante el submit. Compartido por los modales de crear y
 * editar asignación para que ambos se vean igual.
 */
export function PercentageField({
  value,
  onChange,
  disabled,
  invalid,
  error,
}: Readonly<{
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: string | null;
}>) {
  const numeric = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, Math.round(n)));
  }, [value]);

  function handleSlider(next: number) {
    onChange(String(Math.min(100, Math.max(0, Math.round(next)))));
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="assignment-pct-slider">
          Porcentaje <span className="text-destructive">*</span>
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="assignment-pct-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={numeric}
          onChange={(e) => handleSlider(Number(e.target.value))}
          disabled={disabled}
          aria-label="Porcentaje de dedicación"
          aria-invalid={invalid || undefined}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full accent-primary disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-popover [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${numeric}%, var(--muted) ${numeric}%, var(--muted) 100%)`,
          }}
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <Input
            id="assignment-pct-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-label="Porcentaje (valor exacto)"
            disabled={disabled}
            className="w-20 text-right font-mono"
          />
          <span className="text-muted-foreground text-sm">%</span>
        </div>
      </div>

      <FormInlineError message={error} />
    </div>
  );
}

export type ProjectTeamDraft = {
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
};

export type ValidityDraft = {
  validFrom: string;
  validTo: string;
};

function optionLabel(options: MultiCheckboxFilterOption[], value: string): string {
  return options.find((option) => option.value === value)?.label?.toString() ?? "";
}

export type AssignmentDraftValidation = {
  pctValid: boolean;
  canSubmit: boolean;
  pctError: string | null;
  endError: string | null;
  projectError: string | null;
};

/** Validación compartida del draft de los modales de crear/editar asignación. */
export function validateAssignmentDraft(
  draft: ProjectTeamDraft & ValidityDraft & { pct: string },
): AssignmentDraftValidation {
  const pctValid = isPctValueValid(draft.pct);
  const endValid = draft.validTo === "" || draft.validTo >= draft.validFrom;
  const projectValid = draft.projectId.trim() !== "";
  return {
    pctValid,
    canSubmit: pctValid && endValid && projectValid,
    pctError: pctValid ? null : "Debe ser un número entre 1 y 100.",
    endError: endValid
      ? null
      : "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
    projectError: projectValid ? null : "Selecciona un proyecto.",
  };
}

/**
 * Selects de proyecto y equipo de los modales de asignación. El equipo
 * depende del proyecto: al cambiar de proyecto la selección se limpia.
 */
export function ProjectTeamFields<T extends ProjectTeamDraft>({
  idPrefix,
  draft,
  onDraftChange,
  projectOptions,
  teamOptions,
  disabled,
  projectError,
}: Readonly<{
  idPrefix: string;
  draft: T;
  onDraftChange: Dispatch<SetStateAction<T>>;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptions: MultiCheckboxFilterOption[];
  disabled: boolean;
  projectError: string | null;
}>) {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-project`}>
          Proyecto <span className="text-destructive">*</span>
        </Label>
        <ControlledSelectField
          label=""
          value={draft.projectId}
          placeholder="Selecciona un proyecto"
          options={projectOptions}
          onValueChange={(next) =>
            onDraftChange((d) => ({
              ...d,
              projectId: next,
              projectName: optionLabel(projectOptions, next),
              teamId: "",
              teamName: "",
            }))
          }
          disabled={disabled}
          error={projectError}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-team`}>Equipo</Label>
        <ControlledSelectField
          label=""
          value={draft.teamId}
          placeholder="Sin equipo"
          options={[
            { value: "", label: "Sin equipo", key: "__none__" },
            ...teamOptions,
          ]}
          onValueChange={(next) =>
            onDraftChange((d) => ({
              ...d,
              teamId: next,
              teamName: optionLabel(teamOptions, next),
            }))
          }
          disabled={disabled}
        />
      </div>
    </>
  );
}

/** Sección "Vigencia": fecha de inicio y fecha de fin opcional. */
export function ValidityFields<T extends ValidityDraft>({
  idPrefix,
  draft,
  onDraftChange,
  disabled,
  endError,
}: Readonly<{
  idPrefix: string;
  draft: T;
  onDraftChange: Dispatch<SetStateAction<T>>;
  disabled: boolean;
  endError: string | null;
}>) {
  return (
    <>
      <SectionLabel>Vigencia</SectionLabel>

      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-valid-from`}>
          Fecha inicio <span className="text-destructive">*</span>
        </Label>
        <DatePicker
          id={`${idPrefix}-valid-from`}
          value={draft.validFrom}
          disabled={disabled}
          onChange={(v) => onDraftChange((d) => ({ ...d, validFrom: v }))}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-valid-to`}>Fecha fin (opcional)</Label>
        <DatePicker
          id={`${idPrefix}-valid-to`}
          value={draft.validTo}
          min={draft.validFrom}
          disabled={disabled}
          clearable
          onChange={(v) => onDraftChange((d) => ({ ...d, validTo: v }))}
        />
        <FormInlineError message={endError} />
      </div>

      <p className="text-muted-foreground sm:col-span-2 text-xs">
        Si no indicás fecha fin, la asignación queda vigente hasta que se
        cierre manualmente.
      </p>
    </>
  );
}

/** Pie de los modales de asignación: cancelar + acción principal con spinner. */
export function AssignmentDialogFooter({
  submitting,
  canSubmit,
  submitLabel,
  onSave,
}: Readonly<{
  submitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onSave: () => Promise<void>;
}>) {
  return (
    <DialogFooter>
      <DialogClose render={<Button variant="outline" disabled={submitting} />}>
        Cancelar
      </DialogClose>
      <Button
        type="button"
        onClick={() => void onSave()}
        disabled={!canSubmit || submitting}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}
