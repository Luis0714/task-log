"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SprintGoalToolbarProps = {
  storyCount: number;
  totalStoryCount: number;
  goalsCount: number;
  storySearch: string;
  isDirty: boolean;
  canSave: boolean;
  saving: boolean;
  disabled?: boolean;
  onStorySearchChange: (value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function SprintGoalToolbar({
  storyCount,
  totalStoryCount,
  goalsCount,
  storySearch,
  isDirty,
  canSave,
  saving,
  disabled = false,
  onStorySearchChange,
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
      <div className="space-y-1.5">
        <Label htmlFor="sprint-goal-story-search" className="sr-only">
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
            disabled={disabled || saving}
            className="pl-8"
          />
        </div>
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
