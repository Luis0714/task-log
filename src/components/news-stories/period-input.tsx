"use client";

import type { ReactNode } from "react";

import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  type DateFilterMode,
} from "@/components/news-stories/news-stories-reported-format";
import { currentMonthKey } from "@/components/news-stories/news-stories-reported-format";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

/** Descompone un `monthKey` (`YYYY-MM`) en año y mes. Si el valor no encaja,
 *  cae al mes actual para que el selector siga siendo usable. */
function parseMonthKey(monthKey: string): { year: number; month: string } {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  if (!match) {
    const fallback = currentMonthKey();
    return { year: Number(fallback.slice(0, 4)), month: fallback.slice(5, 7) };
  }
  return { year: Number(match[1]), month: match[2] };
}

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
 * - "month" — un par de `<Select>` (Año y Mes) lado a lado, consistente con
 *   el reporte de tiempos por periodo (mismos componentes, mismas opciones).
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
    const { year, month } = parseMonthKey(monthKey);
    const today = currentMonthKey();
    const currentYear = Number(today.slice(0, 4));
    const currentMonthNum = Number(today.slice(5, 7));
    // El selector de año no debe permitir ir más allá del actual.
    const availableYears = YEAR_OPTIONS.filter((y) => y <= currentYear);

    return (
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reported-news-year" className="text-xs font-medium">
            Año
          </Label>
          <Select
            value={String(year)}
            onValueChange={(value) =>
              value && onMonthKeyChange(`${value}-${month}`)
            }
            disabled={disabled}
          >
            <SelectTrigger id="reported-news-year" className="w-28">
              <span>{year}</span>
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reported-news-month" className="text-xs font-medium">
            Mes
          </Label>
          <Select
            value={month}
            onValueChange={(value) =>
              value && onMonthKeyChange(`${year}-${value}`)
            }
            disabled={disabled}
          >
            <SelectTrigger id="reported-news-month" className="w-36">
              <span className="capitalize">
                {MONTH_NAMES[Number(month) - 1] ?? month}
              </span>
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = String(idx + 1).padStart(2, "0");
                // Bloquea meses futuros cuando estamos en el año en curso,
                // replicando el `max={currentMonthKey()}` del input nativo.
                const isFuture =
                  year === currentYear && idx + 1 > currentMonthNum;
                return (
                  <SelectItem
                    key={idx + 1}
                    value={monthNum}
                    disabled={isFuture}
                  >
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
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