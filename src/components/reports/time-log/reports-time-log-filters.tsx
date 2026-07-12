"use client";

import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
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
  { value: "range" as const, label: "Fechas" },
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

/** Etiqueta del trigger multiselección: "Todos", el único, o "N seleccionados". */
function selectionLabel(
  selected: readonly string[],
  allLabel: string,
  countedNoun: string,
): string {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} ${countedNoun}`;
}

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
  nameFilter: string;
  isStale: boolean;
  onPeriodChange: (kind: "month" | "range") => void;
  onYearChange: (year: number) => void;
  onMonthKeyChange: (key: string) => void;
  onRangeFromChange: (iso: string) => void;
  onRangeToChange: (iso: string) => void;
  onProjectIdsChange: (ids: string[]) => void;
  onTeamIdsChange: (ids: string[]) => void;
  onNameFilterChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  payload: HoursReportRequestSchema;
  /** Combobox de mostrar/ocultar personas (aparece tras generar el reporte). */
  visibilityControl?: React.ReactNode;
  exportButton?: React.ReactNode;
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
  nameFilter,
  isStale,
  onPeriodChange,
  onYearChange,
  onMonthKeyChange,
  onRangeFromChange,
  onRangeToChange,
  onProjectIdsChange,
  onTeamIdsChange,
  onNameFilterChange,
  onGenerate,
  generating,
  visibilityControl,
  exportButton,
}: Readonly<ReportsTimeLogFiltersProps>) {
  const showMonth = period.kind === "month";
  const projectOptions = projects.map((p) => ({ value: p.name, label: p.name }));
  const teamOptions = teams.map((t) => ({ value: t.name, label: t.name }));
  const projectsLabel = selectionLabel(
    selectedProjectIds,
    "Todos los proyectos",
    "proyectos seleccionados",
  );
  const teamsLabel = selectionLabel(
    selectedTeamIds,
    "Todos los equipos",
    "equipos seleccionados",
  );

  let generateLabel: string;
  if (generating) generateLabel = "Generando...";
  else if (isStale) generateLabel = "Actualizar reporte";
  else generateLabel = "Generar reporte";

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
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end">
        <div className="flex flex-wrap items-end gap-3 lg:min-w-0 lg:flex-1">
          <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto">
            <Label>Periodo</Label>
            <SegmentedControl
              items={PERIOD_ITEMS}
              value={period.kind}
              onValueChange={onPeriodChange}
              ariaLabel="Tipo de periodo"
              fullWidth
              className="sm:inline-flex sm:w-fit sm:[&>button]:w-auto"
            />
          </div>
          {/* Par de campos del periodo: un solo ítem del flex-wrap, de modo
              que (Año, Mes) o (Desde, Hasta) siempre queden juntos en la
              misma fila y se repartan el ancho disponible. */}
          <div className="flex basis-64 min-w-64 grow gap-3">
            {showMonth ? (
              <>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Label>Año</Label>
                  <Select value={String(year)} onValueChange={(v) => v && onYearChange(Number(v))}>
                    <SelectTrigger>
                      <span>{year}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Label>Mes</Label>
                  <Select value={monthKey.slice(5, 7)} onValueChange={(v) => v && onMonthKeyChange(`${year}-${v}`)}>
                    <SelectTrigger>
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
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Label>Desde</Label>
                  <DatePicker value={rangeFrom} onChange={onRangeFromChange} max={rangeTo} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Label>Hasta</Label>
                  <DatePicker value={rangeTo} onChange={onRangeToChange} min={rangeFrom} />
                </div>
              </>
            )}
          </div>
          <div className="flex basis-48 min-w-48 grow flex-col gap-1.5">
            <Label htmlFor="reports-time-log-name-filter">Persona</Label>
            <Input
              id="reports-time-log-name-filter"
              type="text"
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              placeholder="Filtrar por nombre…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end lg:shrink-0 lg:border-l lg:border-border lg:pl-6">
          {visibilityControl}
          <Button
            onClick={onGenerate}
            disabled={generating}
            variant={isStale ? "default" : "outline"}
            className="flex-1 sm:flex-none"
            aria-label={
              isStale
                ? "Hay filtros sin aplicar. Genera el reporte para actualizarlos."
                : undefined
            }
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
            {generating ? "Generando..." : generateLabel}
          </Button>
          {exportButton ? (
            <div className="flex-1 sm:flex-none [&_button]:w-full sm:[&_button]:w-auto">
              {exportButton}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}