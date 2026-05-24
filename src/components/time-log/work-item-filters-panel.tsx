"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type WorkItemFiltersPanelProps = {
  filters: WorkItemFilters;
  states: string[];
  filteredCount: number;
  totalCount: number;
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onAssignedToMeChange: (value: boolean) => void;
  onStateChange: (value: string) => void;
};

export function WorkItemFiltersPanel({
  filters,
  states,
  filteredCount,
  totalCount,
  disabled = false,
  onSearchChange,
  onAssignedToMeChange,
  onStateChange,
}: WorkItemFiltersPanelProps) {
  const showCount = totalCount > 0 && !disabled;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Filtros de work items</p>
        {showCount && (
          <p className="text-muted-foreground text-xs">
            {filteredCount} de {totalCount}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="work-item-search">Buscar por nombre o ID</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="work-item-search"
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ej. login, API, 12345"
              disabled={disabled}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="work-item-assigned">Asignación</Label>
          <Select
            value={filters.assignedToMe ? "me" : "all"}
            onValueChange={(value) => {
              if (!value) return;
              onAssignedToMeChange(value === "me");
            }}
            disabled={disabled}
          >
            <SelectTrigger id="work-item-assigned" className="w-full">
              <SelectValue>
                {filters.assignedToMe ? "Asignados a mí" : "Todos"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="me">Asignados a mí</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="work-item-state">Estado</Label>
          <Select
            value={filters.state || "__all__"}
            onValueChange={(value) => {
              if (!value) return;
              onStateChange(value === "__all__" ? "" : value);
            }}
            disabled={disabled || states.length === 0}
          >
            <SelectTrigger id="work-item-state" className="w-full">
              <SelectValue placeholder="Todos los estados">
                {filters.state || "Todos los estados"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
