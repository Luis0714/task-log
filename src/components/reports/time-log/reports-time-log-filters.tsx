"use client";

import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type {
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";
import type { AdoProjectDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";

const PERIOD_ITEMS = [
  { value: "month" as const, label: "Mes" },
  { value: "range" as const, label: "Rango personalizado" },
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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
  selectedProjectIds: string[];
  selectedTeamIds: string[];
  onPeriodChange: (kind: "month" | "range") => void;
  onYearChange: (year: number) => void;
  onMonthKeyChange: (key: string) => void;
  onRangeFromChange: (iso: string) => void;
  onRangeToChange: (iso: string) => void;
  onProjectIdsChange: (ids: string[]) => void;
  onTeamIdsChange: (ids: string[]) => void;
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
  selectedProjectIds,
  selectedTeamIds,
  onPeriodChange,
  onYearChange,
  onMonthKeyChange,
  onRangeFromChange,
  onRangeToChange,
  onProjectIdsChange,
  onTeamIdsChange,
  onGenerate,
  generating,
}: Readonly<ReportsTimeLogFiltersProps>) {
  const showMonth = period.kind === "month";
  const projectOptions = projects.map((p) => ({ value: p.name, label: p.name }));
  const teamOptions = teams.map((t) => ({ value: t.name, label: t.name }));
  const projectsLabel =
    selectedProjectIds.length === 0
      ? "Todos los proyectos"
      : selectedProjectIds.length === 1
        ? selectedProjectIds[0]
        : `${selectedProjectIds.length} proyectos seleccionados`;
  const teamsLabel =
    selectedTeamIds.length === 0
      ? "Todos los equipos"
      : selectedTeamIds.length === 1
        ? selectedTeamIds[0]
        : `${selectedTeamIds.length} equipos seleccionados`;

  return (
    <div className="space-y-4 rounded-md border p-4">
      
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MultiCheckboxFilter
          id="page-projects"
          label="Proyectos"
          options={projectOptions}
          selected={selectedProjectIds}
          onSelectedChange={onProjectIdsChange}
          triggerLabel={projectsLabel}
          disabled={projectOptions.length === 0}
        />
        <MultiCheckboxFilter
          id="page-teams"
          label="Equipos"
          options={teamOptions}
          selected={selectedTeamIds}
          onSelectedChange={onTeamIdsChange}
          triggerLabel={teamsLabel}
          disabled={teamOptions.length === 0}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl
          items={PERIOD_ITEMS}
          value={period.kind}
          onValueChange={onPeriodChange}
          ariaLabel="Tipo de periodo"
        />
        {showMonth ? (
          <>
            <div className="space-y-1.5">
              <Label>Año</Label>
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
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select value={monthKey.slice(5, 7)} onValueChange={(v) => v && onMonthKeyChange(`${year}-${v}`)}>
                <SelectTrigger className="w-40">
                  <span className="capitalize">{MONTH_NAMES[Number(monthKey.slice(5, 7)) - 1] ?? monthKey}</span>
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1).padStart(2, "0")}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="w-44 space-y-1.5">
              <Label>Desde</Label>
              <DatePicker value={rangeFrom} onChange={onRangeFromChange} max={rangeTo} />
            </div>
            <div className="w-44 space-y-1.5">
              <Label>Hasta</Label>
              <DatePicker value={rangeTo} onChange={onRangeToChange} min={rangeFrom} />
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
    </div>
  );
}