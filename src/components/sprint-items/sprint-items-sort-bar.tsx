"use client";

import { Search } from "lucide-react";

import { DataTableSortControl } from "@/components/data-table/data-table-sort-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DataTableSortSpec } from "@/lib/data-table/data-table-sort";
import {
  SPRINT_SORT_OPTIONS,
  type SprintSortField,
} from "@/lib/sprint-items/sprint-items-sort";

type SprintItemsSortBarProps = {
  sort: DataTableSortSpec<SprintSortField>;
  onSortChange: (sort: DataTableSortSpec<SprintSortField>) => void;
  nameSearch: string;
  onNameSearchChange: (value: string) => void;
};

export function SprintItemsSortBar({
  sort,
  onSortChange,
  nameSearch,
  onNameSearchChange,
}: SprintItemsSortBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <DataTableSortControl
        value={sort}
        options={SPRINT_SORT_OPTIONS}
        fieldClassName="w-48"
        onChange={onSortChange}
      />

      <div className="flex min-w-52 flex-1 flex-col gap-1.5">
        <Label className="text-xs">Nombre de tarea o HU</Label>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar..."
            className="h-8 pl-8 text-sm"
            value={nameSearch}
            onChange={(e) => onNameSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
