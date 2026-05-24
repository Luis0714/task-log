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
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import {
  WORK_ITEM_ASSIGNEE_ALL,
  WORK_ITEM_ASSIGNEE_ME,
  resolveWorkItemAssigneeLabel,
} from "@/lib/schemas/work-item-filters";

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
  onStateChange: (value: string) => void;
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
  title = "Filtros de work items",
  onSearchChange,
  onAssigneeChange,
  onStateChange,
}: WorkItemFiltersPanelProps) {
  const showCount = totalCount > 0 && !disabled;
  const assigneeLabel = resolveWorkItemAssigneeLabel(filters.assignee, members);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
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
              placeholder="Ej. HU67 crear componente, login"
              disabled={disabled}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="work-item-assigned">Asignación</Label>
          <Select
            value={filters.assignee || WORK_ITEM_ASSIGNEE_ALL}
            onValueChange={(value) => {
              if (!value) return;
              onAssigneeChange(value);
            }}
            disabled={disabled || membersLoading}
          >
            <SelectTrigger id="work-item-assigned" className="w-full">
              <SelectValue>
                {membersLoading ? "Cargando miembros..." : assigneeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WORK_ITEM_ASSIGNEE_ME}>Asignados a mí</SelectItem>
              <SelectItem value={WORK_ITEM_ASSIGNEE_ALL}>Todos</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.displayName}>
                  {member.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {membersError ? (
            <p className="text-destructive text-xs">{membersError}</p>
          ) : null}
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
