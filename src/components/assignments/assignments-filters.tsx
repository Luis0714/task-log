"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export type AssignmentsFiltersValue = {
  personQuery: string;
  /**
   * Filtro por mes "YYYY-MM". Excluyente con el rango de fechas: al definir
   * uno se limpia el otro.
   */
  month: string;
  /** Filtro por rango de fechas "YYYY-MM-DD". Excluyente con el mes. */
  from: string;
  to: string;
};

export const EMPTY_ASSIGNMENTS_FILTERS: AssignmentsFiltersValue = {
  personQuery: "",
  month: "",
  from: "",
  to: "",
};

export type AssignmentsFiltersProps = Readonly<{
  value: AssignmentsFiltersValue;
  onChange: (next: AssignmentsFiltersValue) => void;
  /** Limpia todos los filtros. */
  onClear: () => void;
}>;

export function AssignmentsFilters({
  value,
  onChange,
  onClear,
}: AssignmentsFiltersProps) {
  const rangeActive = Boolean(value.from || value.to);
  const monthActive = Boolean(value.month);

  function setPersonQuery(personQuery: string) {
    onChange({ ...value, personQuery });
  }

  function setMonth(month: string) {
    // Excluyentes: al usar el mes se limpia el rango.
    onChange({ ...value, month, from: "", to: "" });
  }

  function setRange(patch: { from?: string; to?: string }) {
    const next = { ...value, ...patch };
    const active = Boolean(next.from || next.to);
    // Excluyentes: al usar el rango se limpia el mes.
    onChange({ ...next, month: active ? "" : next.month });
  }

  const hasAnyFilter = Boolean(
    value.personQuery || value.month || value.from || value.to,
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="assignments-filter-person" className="text-xs font-medium">
          Persona
        </label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="assignments-filter-person"
            value={value.personQuery}
            onChange={(e) => setPersonQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <label htmlFor="assignments-filter-month" className="text-xs font-medium">
          Mes
        </label>
        <Input
          id="assignments-filter-month"
          type="month"
          value={value.month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={rangeActive}
          className="w-40 font-mono"
          title={
            rangeActive
              ? "Deshabilitado mientras usas el rango de fechas"
              : undefined
          }
        />
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <span className="text-xs font-medium">Rango de fechas</span>
        <div className="flex items-center gap-2">
          <DatePicker
            id="assignments-filter-from"
            value={value.from}
            onChange={(next) => setRange({ from: next })}
            placeholder="Inicio"
            disabled={monthActive}
            className="w-36"
          />
          <span className="text-muted-foreground text-xs">a</span>
          <DatePicker
            id="assignments-filter-to"
            value={value.to}
            onChange={(next) => setRange({ to: next })}
            min={value.from || undefined}
            placeholder="Fin"
            disabled={monthActive}
            className="w-36"
          />
        </div>
      </div>

      {hasAnyFilter ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0"
        >
          <X className="size-4" aria-hidden />
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
