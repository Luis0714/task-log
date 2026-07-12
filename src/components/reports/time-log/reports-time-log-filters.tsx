"use client";

import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type {
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";
import type { AdoProjectDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";

const PERIOD_ITEMS = [
  { value: "month" as const, label: "Mes" },
  { value: "range" as const, label: "Rango personalizado" },
];

const MONTH_OPTIONS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
].map((m) => ({
  value: m,
  label: new Date(`2026-${m}-01`).toLocaleString("es-CO", { month: "long" }),
}));

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export type ReportsTimeLogFiltersProps = {
  projects: ReadonlyArray<AdoProjectDto>;
  teams: ReadonlyArray<AdoTeamDto>;
  period: HoursReportPeriodSchema;
  year: number;
  monthKey: string;
  rangeFrom: string;
  rangeTo: string;
  onPeriodChange: (kind: "month" | "range") => void;
  onYearChange: (year: number) => void;
  onMonthKeyChange: (key: string) => void;
  onRangeFromChange: (iso: string) => void;
  onRangeToChange: (iso: string) => void;
  onGenerate: () => void;
  generating: boolean;
  payload: HoursReportRequestSchema;
};

export function ReportsTimeLogFilters({
  projects,
  teams,
  period,
  year,
  monthKey,
  rangeFrom,
  rangeTo,
  onPeriodChange,
  onYearChange,
  onMonthKeyChange,
  onRangeFromChange,
  onRangeToChange,
  onGenerate,
  generating,
}: Readonly<ReportsTimeLogFiltersProps>) {
  const showMonth = period.kind === "month";
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl
          items={PERIOD_ITEMS}
          value={period.kind}
          onValueChange={onPeriodChange}
          ariaLabel="Tipo de periodo"
        />
        {showMonth ? (
          <>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Año</span>
              <Select value={String(year)} onValueChange={(v) => v && onYearChange(Number(v))}>
                <SelectTrigger className="w-32">
                  <span>{year}</span>
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Mes</span>
              <Select value={monthKey.slice(5, 7)} onValueChange={(v) => v && onMonthKeyChange(`${year}-${v}`)}>
                <SelectTrigger className="w-40">
                  <span className="capitalize">{MONTH_OPTIONS.find((m) => m.value === monthKey.slice(5, 7))?.label ?? monthKey}</span>
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="capitalize">{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Desde</span>
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => onRangeFromChange(e.target.value)}
                className="border-input rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Hasta</span>
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => onRangeToChange(e.target.value)}
                className="border-input rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
        <div className="ml-auto">
          <Button onClick={onGenerate} disabled={generating}>
            {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
            {generating ? "Generando..." : "Generar reporte"}
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Proyectos disponibles: {projects.length} · Equipos disponibles: {teams.length}
      </p>
    </div>
  );
}