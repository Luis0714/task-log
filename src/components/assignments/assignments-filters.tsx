"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AssignmentsFiltersValue = {
  personQuery: string;
};

export type AssignmentsFiltersProps = Readonly<{
  value: AssignmentsFiltersValue;
  onChange: (next: AssignmentsFiltersValue) => void;
}>;

export function AssignmentsFilters({ value, onChange }: AssignmentsFiltersProps) {
  function update(patch: Partial<AssignmentsFiltersValue>) {
    onChange({ ...value, ...patch });
  }

  function clear() {
    onChange({ personQuery: "" });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5 sm:max-w-xs sm:flex-1">
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
            onChange={(e) => update({ personQuery: e.target.value })}
            placeholder="Buscar por nombre…"
            className="pl-8"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clear}
        className="self-start sm:self-auto"
      >
        <X className="size-4" aria-hidden />
        Limpiar filtros
      </Button>
    </div>
  );
}
