"use client";

import { Search } from "lucide-react";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { WorkItemAssigneeFilter } from "@/components/filters/work-item-assignee-filter";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { resolveWorkItemStatesLabel } from "@/lib/schemas/work-item-filters";

export type WorkItemFiltersPanelProps = {
  filters: WorkItemFilters;
  states: string[];
  members: AdoTeamMemberDto[];
  membersLoading?: boolean;
  membersError?: string | null;
  filteredCount: number;
  totalCount: number;
  disabled?: boolean;
  title?: string;
  onSearchChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onStatesChange: (value: string[]) => void;
};

export function WorkItemFiltersPanel({
  filters,
  states,
  members,
  membersLoading = false,
  membersError = null,
  filteredCount,
  totalCount,
  disabled = false,
  title = "Filtros de elementos de trabajo",
  onSearchChange,
  onAssigneeChange,
  onStatesChange,
}: WorkItemFiltersPanelProps) {
  const showCount = totalCount > 0 && !disabled;
  const statesLabel = resolveWorkItemStatesLabel(filters.states, states.length);

  const stateOptions = states.map((state) => ({
    value: state,
    label: <WorkItemStateLabel state={state} />,
  }));

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        {showCount ? (
          <p className="text-muted-foreground text-xs">
            {filteredCount} de {totalCount}
          </p>
        ) : null}
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
              placeholder="Ej. HU67 crear componente, login"
              disabled={disabled}
              className="pl-8"
            />
          </div>
        </div>

        <WorkItemAssigneeFilter
          id="work-item-assigned"
          assignee={filters.assignee}
          members={members}
          membersLoading={membersLoading}
          membersError={membersError}
          disabled={disabled}
          onAssigneeChange={onAssigneeChange}
        />

        <MultiCheckboxFilter
          id="work-item-state"
          label="Estado"
          options={stateOptions}
          selected={filters.states}
          onSelectedChange={onStatesChange}
          triggerLabel={statesLabel}
          presets={[
            {
              label: "Todos los estados",
              active: filters.states.length === 0,
              onSelect: () => onStatesChange([]),
            },
          ]}
          disabled={disabled || states.length === 0}
        />
      </div>
    </div>
  );
}
