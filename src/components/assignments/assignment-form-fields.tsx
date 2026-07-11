"use client";

import { useMemo } from "react";

import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
