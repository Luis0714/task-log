"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const PERIOD_ITEMS = [
  { value: "month" as const, label: "Mes" },
  { value: "range" as const, label: "Rango" },
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export type ReportsTimeLogExportPeriodInputProps = {
  periodKind: "month" | "range";
  year: number;
  monthKey: string;
  rangeFrom: string;
  rangeTo: string;
  onPeriodKindChange: (kind: "month" | "range") => void;
  onMonthKeyChange: (key: string) => void;
  onRangeFromChange: (iso: string) => void;
  onRangeToChange: (iso: string) => void;
};

export function ReportsTimeLogExportPeriodInput({
  periodKind,
  year,
  monthKey,
  rangeFrom,
  rangeTo,
  onPeriodKindChange,
  onMonthKeyChange,
  onRangeFromChange,
  onRangeToChange,
}: Readonly<ReportsTimeLogExportPeriodInputProps>) {
  return (
    <div className="space-y-3">
      <SegmentedControl
        items={PERIOD_ITEMS}
        value={periodKind}
        onValueChange={onPeriodKindChange}
        ariaLabel="Periodo"
      />
      {periodKind === "month" ? (
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(year)} onValueChange={(v) => v && onMonthKeyChange(`${v}-${monthKey.slice(5, 7) || "01"}`)}>
            <SelectTrigger className="w-full">
              <span>{year}</span>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getUTCFullYear() - i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthKey.slice(5, 7) || "01"} onValueChange={(v) => v && onMonthKeyChange(`${year}-${v}`)}>
            <SelectTrigger className="w-full">
              <span>{MONTH_NAMES[Number(monthKey.slice(5, 7) || "01") - 1] ?? "Mes"}</span>
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1).padStart(2, "0")}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={rangeFrom}
            onChange={(e) => onRangeFromChange(e.target.value)}
            className="border-input rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={rangeTo}
            onChange={(e) => onRangeToChange(e.target.value)}
            className="border-input rounded-md border px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}