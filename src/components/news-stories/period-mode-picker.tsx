"use client";

import type { ReactNode } from "react";

import type { DateFilterMode } from "@/components/news-stories/news-stories-reported-format";

export type PeriodModePickerProps = Readonly<{
  mode: DateFilterMode;
  onChange: (next: DateFilterMode) => void;
  /** Deshabilita todos los pills (p.ej. hasta que el admin elija proyecto). */
  disabled?: boolean;
}>;

/**
 * Pill segmented de tres modos mutuamente excluyentes (Mes / Fechas / Todas).
 * Es `<fieldset>` con `<button aria-pressed>` para que sea accesible a
 * lectores de pantalla y teclado sin reinventar el radio group.
 */
export function PeriodModePicker({
  mode,
  onChange,
  disabled = false,
}: PeriodModePickerProps): ReactNode {
  return (
    <fieldset
      aria-label="Periodo"
      className="border-input bg-background inline-flex h-9 w-fit overflow-hidden rounded-md border"
    >
      <legend className="sr-only">Periodo</legend>
      <PeriodPill
        label="Mes"
        active={mode === "month"}
        disabled={disabled}
        onClick={() => onChange("month")}
      />
      <PeriodPill
        label="Fechas"
        active={mode === "range"}
        disabled={disabled}
        onClick={() => onChange("range")}
      />
      <PeriodPill
        label="Todas"
        active={mode === "all"}
        disabled={disabled}
        onClick={() => onChange("all")}
      />
    </fieldset>
  );
}

function PeriodPill({
  label,
  active,
  disabled,
  onClick,
}: Readonly<{
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={
        active
          ? "bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center px-4 py-1.5 text-xs font-medium"
          : "text-muted-foreground hover:text-foreground inline-flex flex-1 items-center justify-center px-4 py-1.5 text-xs font-medium transition-colors"
      }
    >
      {label}
    </button>
  );
}
