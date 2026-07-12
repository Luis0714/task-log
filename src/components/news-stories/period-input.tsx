"use client";

import type { ReactNode } from "react";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatMonthLabel,
  type DateFilterMode,
} from "@/components/news-stories/news-stories-reported-format";
import { currentMonthKey } from "@/components/news-stories/news-stories-reported-format";

export type PeriodInputProps = Readonly<{
  mode: DateFilterMode;
  disabled: boolean;
  monthKey: string;
  onMonthKeyChange: (next: string) => void;
  rangeFrom: string;
  rangeTo: string;
  onRangeFromChange: (next: string) => void;
  onRangeToChange: (next: string) => void;
}>;

/**
 * Input concreto del periodo activo. Cambia su layout según el modo:
 * - "month" — un `<input type="month">` con label legible ("Julio de 2026").
 * - "range" — dos `<DatePicker>` lado a lado (Desde / Hasta).
 * - "all"   — sin inputs: muestra texto indicativo.
 */
export function PeriodInput({
  mode,
  disabled,
  monthKey,
  onMonthKeyChange,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
}: PeriodInputProps): ReactNode {
  if (mode === "month") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reported-news-month" className="text-xs font-medium">
          {formatMonthLabel(monthKey)}
        </Label>
        <Input
          id="reported-news-month"
          type="month"
          value={monthKey}
          onChange={(event) => onMonthKeyChange(event.target.value)}
          max={currentMonthKey()}
          disabled={disabled}
          className="w-full sm:w-44 font-mono"
        />
      </div>
    );
  }

  if (mode === "range") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="sr-only">Rango de fechas</span>
        <div className="flex items-end gap-2">
          <DatePicker
            id="reported-news-from"
            value={rangeFrom}
            onChange={onRangeFromChange}
            disabled={disabled}
            placeholder="desde"
            className="w-44"
          />
          <DatePicker
            id="reported-news-to"
            value={rangeTo}
            onChange={onRangeToChange}
            disabled={disabled}
            placeholder="hasta"
            className="w-44"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">Periodo</Label>
      <p className="text-muted-foreground inline-flex h-9 items-center text-xs italic">
        Todas las novedades reportadas (sin filtro de periodo).
      </p>
    </div>
  );
}
