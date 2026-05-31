"use client";

import { Search } from "lucide-react";

import { DataTableSortControl } from "@/components/data-table/data-table-sort-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DataTableSortSpec } from "@/lib/data-table/data-table-sort";
import {
  SPRINT_STORY_GOAL_SORT_OPTIONS,
  type SprintStoryGoalSortField,
} from "@/lib/sprints/sort-sprint-story-goal-rows";

export type SprintGoalFiltersPanelProps = {
  storySearch: string;
  sortSpec: DataTableSortSpec<SprintStoryGoalSortField>;
  disabled?: boolean;
  onStorySearchChange: (value: string) => void;
  onSortSpecChange: (value: DataTableSortSpec<SprintStoryGoalSortField>) => void;
};

export function SprintGoalFiltersPanel({
  storySearch,
  sortSpec,
  disabled = false,
  onStorySearchChange,
  onSortSpecChange,
}: SprintGoalFiltersPanelProps) {
  return (
    <div className="grid items-end gap-3 border-t pt-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="sprint-goal-story-search" className="text-xs">
          Buscar historia
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
            disabled={disabled}
            className="pl-8"
          />
        </div>
      </div>

      <DataTableSortControl
        value={sortSpec}
        options={SPRINT_STORY_GOAL_SORT_OPTIONS}
        disabled={disabled}
        className="justify-self-start"
        onChange={onSortSpecChange}
      />
    </div>
  );
}
