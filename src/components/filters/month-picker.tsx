"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
const DEFAULT_YEAR_OPTIONS = Array.from(
  { length: 5 },
  (_, i) => CURRENT_YEAR - i,
);

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

export type MonthPickerProps = Readonly<{
  /** Mes en formato `YYYY-MM`. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Prefijo para los `id`/`<label htmlFor>` de los selects (Año/Mes). */
  idPrefix?: string;
  /** Años disponibles (descendente). Por defecto, los últimos 5 años. */
  yearOptions?: readonly number[];
}>;

/**
 * Selector de mes compartido entre módulos: par de `<Select>` (Año + Mes)
 * con los nombres en español. Misma UI que el reporte de horas por periodo,
 * el admin de novedades y Solicitudes & Novedades.
 */
export function MonthPicker({
  value,
  onChange,
  disabled = false,
  idPrefix = "month-picker",
  yearOptions = DEFAULT_YEAR_OPTIONS,
}: MonthPickerProps) {
  const { year, month } = parseMonthKey(value);
  const today = currentMonthKey();
  const currentYear = Number(today.slice(0, 4));
  const currentMonthNum = Number(today.slice(5, 7));
  // El selector de año no debe permitir ir más allá del actual.
  const availableYears = yearOptions.filter((y) => y <= currentYear);

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-year`} className="text-xs font-medium">
          Año
        </Label>
        <Select
          value={String(year)}
          onValueChange={(next) => next && onChange(`${next}-${month}`)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-year`} className="w-28">
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
        <Label htmlFor={`${idPrefix}-month`} className="text-xs font-medium">
          Mes
        </Label>
        <Select
          value={month}
          onValueChange={(next) => next && onChange(`${year}-${next}`)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-month`} className="w-36">
            <span className="capitalize">
              {MONTH_NAMES[Number(month) - 1] ?? month}
            </span>
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = String(idx + 1).padStart(2, "0");
              // Bloquea meses futuros cuando estamos en el año en curso.
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
