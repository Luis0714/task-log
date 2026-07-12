"use client";

import { useEffect, useState } from "react";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

/** Validador único de % (1–100, entero). Reutilizable por la celda y por tests. */
export function isPctValueValid(value: string): boolean {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 100;
}

const NO_VALUE = "__none__";

type CommonCellProps = Readonly<{
  disabled?: boolean;
}>;

export type SelectCellProps = CommonCellProps &
  Readonly<{
    label?: string;
    value: string;
    options: { value: string; label: string }[];
    placeholder: string;
    onCommit: (next: string) => void;
    /** Cuando cambia el valor; usado para resetear valores dependientes. */
    onValueChange?: (next: string) => void;
    emptyMessage?: string;
  }>;

export function SelectCell({
  label,
  value,
  options,
  placeholder,
  onCommit,
  onValueChange,
  disabled,
  emptyMessage,
}: SelectCellProps) {
  return (
    <ControlledSelectField
      label={label ?? ""}
      value={value || NO_VALUE}
      placeholder={placeholder}
      options={options}
      disabled={disabled}
      displayValue={
        options.find((o) => o.value === value)?.label ?? (
          <span className="text-muted-foreground">{placeholder}</span>
        )
      }
      emptyMessage={emptyMessage}
      onValueChange={(next) => {
        if (next === NO_VALUE) return;
        onValueChange?.(next);
        onCommit(next);
      }}
    />
  );
}

export type PercentCellProps = CommonCellProps &
  Readonly<{
    pct: number;
    onCommit: (nextPct: number) => void;
  }>;

export function PercentCell({ pct, onCommit, disabled }: PercentCellProps) {
  const [draft, setDraft] = useState(String(pct));
  useEffect(() => {
    setDraft(String(pct));
  }, [pct]);

  const valid = isPctValueValid(draft);

  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={100}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) {
            onCommit(Number(draft));
          }
        }}
        onBlur={() => {
          if (valid && Number(draft) !== pct) onCommit(Number(draft));
          else setDraft(String(pct));
        }}
        aria-label="Porcentaje de asignación"
        aria-invalid={!valid}
        disabled={disabled}
        className="h-8 w-16 text-right font-mono"
      />
      <span className="text-muted-foreground">%</span>
    </div>
  );
}

export type DateCellProps = CommonCellProps &
  Readonly<{
    label: string;
    value: string;
    /** Día mínimo permitido (YYYY-MM-DD). */
    min?: string;
    onCommit: (nextIso: string) => void;
  }>;

export function DateCell({
  label,
  value,
  min,
  onCommit,
  disabled,
}: DateCellProps) {
  return (
    <DatePicker
      id={`assignment-cell-${label}`}
      value={value}
      min={min}
      disabled={disabled}
      onChange={(next) => onCommit(next)}
      className="w-36"
      placeholder={label}
    />
  );
}
