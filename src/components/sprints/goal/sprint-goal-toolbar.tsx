"use client";

import { Search } from "lucide-react";

import { DataTableSortControl } from "@/components/data-table/data-table-sort-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DataTableSortSpec } from "@/lib/data-table/data-table-sort";
import {
  SPRINT_STORY_GOAL_SORT_OPTIONS,
  type SprintStoryGoalSortField,
} from "@/lib/sprints/sort-sprint-story-goal-rows";

export type SprintGoalToolbarProps = {
  storyCount: number;
  totalStoryCount: number;
  goalsCount: number;
  storySearch: string;
  sortSpec: DataTableSortSpec<SprintStoryGoalSortField>;
  isDirty: boolean;
  canSave: boolean;
  saving: boolean;
  disabled?: boolean;
  onStorySearchChange: (value: string) => void;
  onSortSpecChange: (value: DataTableSortSpec<SprintStoryGoalSortField>) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function SprintGoalToolbar({
  storyCount,
  totalStoryCount,
  goalsCount,
  storySearch,
  sortSpec,
  isDirty,
  canSave,
  saving,
  disabled = false,
  onStorySearchChange,
  onSortSpecChange,
  onSave,
  onDiscard,
}: SprintGoalToolbarProps) {
  const isFiltering = storySearch.trim().length > 0;
  const storyCountLabel =
    isFiltering && storyCount !== totalStoryCount
      ? `${storyCount} de ${totalStoryCount} historias`
      : `${storyCount} historia${storyCount === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sprint-goal-story-search" className="text-xs">
            Buscar
          </Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="sprint-goal-story-search"
              value={storySearch}
              onChange={(event) => onStorySearchChange(event.target.value)}
              placeholder="Buscar HU por ID o título…"
              disabled={disabled || saving}
              className="pl-8"
            />
          </div>
        </div>

        <DataTableSortControl
          value={sortSpec}
          options={SPRINT_STORY_GOAL_SORT_OPTIONS}
          disabled={disabled || saving}
          className="justify-self-start"
          onChange={onSortSpecChange}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {storyCountLabel} · {goalsCount} con objetivo
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || saving}
            onClick={onDiscard}
          >
            Descartar
          </Button>
          <Button type="button" size="sm" disabled={!canSave} onClick={onSave}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
