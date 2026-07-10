"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BulkDeleteTasksDialog } from "@/components/tasks/bulk-delete-tasks-dialog";
import { BulkChangeStatusTasksDialog } from "@/components/tasks/bulk-change-status-tasks-dialog";
import { BulkReassignParentTasksDialog } from "@/components/tasks/bulk-reassign-parent-tasks-dialog";

export type BulkTasksActionsBarProps = {
  project: string | null;
  selectedIds: number[];
  stateNames: readonly string[];
  workingDate?: string;
  onClear: () => void;
  onCompleted: () => void;
};

export function BulkTasksActionsBar({
  project,
  selectedIds,
  stateNames,
  workingDate,
  onClear,
  onCompleted,
}: BulkTasksActionsBarProps) {
  if (selectedIds.length === 0) return null;

  const count = selectedIds.length;
  const noun = count === 1 ? "tarea seleccionada" : "tareas seleccionadas";

  return (
    <div
      role="region"
      aria-label="Acciones en lote"
      className="bg-background sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 shadow-sm"
    >
      <span className="text-sm font-medium">
        {count} {noun}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <BulkReassignParentTasksDialog
          project={project ?? ""}
          ids={selectedIds}
          onCompleted={onCompleted}
        />
        <BulkChangeStatusTasksDialog
          project={project ?? ""}
          ids={selectedIds}
          stateNames={stateNames}
          workingDate={workingDate}
          onCompleted={onCompleted}
        />
        <BulkDeleteTasksDialog
          project={project ?? ""}
          ids={selectedIds}
          onCompleted={onCompleted}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Limpiar selección"
          onClick={onClear}
        >
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
