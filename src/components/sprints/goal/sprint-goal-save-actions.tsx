"use client";

import { Button } from "@/components/ui/button";

export type SprintGoalSaveActionsProps = {
  isDirty: boolean;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function SprintGoalSaveActions({
  isDirty,
  canSave,
  saving,
  onSave,
  onDiscard,
}: SprintGoalSaveActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
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
  );
}
