"use client";

import { useCallback, useMemo, useState } from "react";

import { BugDetailSheet } from "@/components/bugs/bug-detail-sheet";
import { SprintLoggedHoursBadge } from "@/components/dashboard/metrics/sprint-logged-hours-badge";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintItemList, type SprintItemListSelection } from "@/components/sprint-items/sprint-item-list";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { BulkTasksActionsBar } from "@/components/tasks/bulk-tasks-actions-bar";
import { useSprintItemsLists } from "@/hooks/sprint-items/use-sprint-items-lists";
import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { sumTaskLoggedHours } from "@/lib/dashboard/task-hours";

const COPY: Record<
  SprintItemsKind,
  { sectionTitle: string; sectionDescription: string; emptyMessage: string }
> = {
  bugs: {
    sectionTitle: "Bugs del sprint",
    sectionDescription: "Todos los Bugs que coinciden con los filtros.",
    emptyMessage: "No hay Bugs que coincidan con los filtros.",
  },
  tasks: {
    sectionTitle: "Tareas del sprint",
    sectionDescription: "Todas las tareas que coinciden con los filtros.",
    emptyMessage: "No hay tareas que coincidan con los filtros.",
  },
};

export type SprintItemsListsProps = {
  kind: SprintItemsKind;
  snapshot: SprintItemsDataSnapshot;
  filters: WorkItemFilters;
  dayKey: string;
  sprintWorkingDays: SprintWorkingDay[];
  project: string | null;
  onSaved: () => void;
};

export function SprintItemsLists({
  kind,
  snapshot,
  filters,
  dayKey,
  sprintWorkingDays,
  project,
  onSaved,
}: SprintItemsListsProps) {
  const { filteredItems } = useSprintItemsLists(snapshot, filters, dayKey);
  const copy = COPY[kind];
  const totalTaskHours = useMemo(
    () => (kind === "tasks" ? sumTaskLoggedHours(filteredItems) : 0),
    [filteredItems, kind],
  );

  const [selectedItem, setSelectedItem] = useState<AdoWorkItemOptionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Selección bulk. Sólo se usa cuando kind === "tasks"; para "bugs" se ignora.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );

  const handleItemClick = useCallback((item: AdoWorkItemOptionDto) => {
    setSelectedItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedItem(null);
  }, []);

  const handleToggleId = useCallback((id: number, next: boolean) => {
    setSelectedIds((prev) => {
      const next_set = new Set(prev);
      if (next) {
        next_set.add(id);
      } else {
        next_set.delete(id);
      }
      return next_set;
    });
  }, []);

  const handleToggleAll = useCallback(
    (next: boolean) => {
      if (!next) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    },
    [filteredItems],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkCompleted = useCallback(() => {
    // Tras un cambio bulk, refrescar datos del servidor y limpiar la selección
    // (los IDs eliminados ya no existen; los actualizados pueden seguir si
    // el usuario quiere repetir, pero la convención más limpia es limpiar).
    setSelectedIds(new Set());
    onSaved();
  }, [onSaved]);

  const stateNames = useMemo(
    () => snapshot.itemStates.map((state) => state.name),
    [snapshot.itemStates],
  );

  const selection: SprintItemListSelection | undefined =
    kind === "tasks"
      ? { selectedIds, onToggle: handleToggleId, onToggleAll: handleToggleAll }
      : undefined;

  return (
    <>
      <DashboardSection
        title={copy.sectionTitle}
        description={copy.sectionDescription}
        action={
          kind === "tasks" ? <SprintLoggedHoursBadge hours={totalTaskHours} /> : undefined
        }
      >
        {kind === "tasks" ? (
          <BulkTasksActionsBar
            project={project}
            selectedIds={Array.from(selectedIds)}
            stateNames={stateNames}
            workingDate={dayKey}
            onClear={handleClearSelection}
            onCompleted={handleBulkCompleted}
          />
        ) : null}
        <SprintItemList
          items={filteredItems}
          emptyMessage={copy.emptyMessage}
          onItemClick={handleItemClick}
          selection={selection}
        />
      </DashboardSection>

      {kind === "bugs" ? (
        <BugDetailSheet
          open={sheetOpen}
          onOpenChange={handleSheetOpenChange}
          bug={selectedItem}
          bugStates={snapshot.itemStates}
          project={project}
          sprintWorkingDays={sprintWorkingDays}
          onSaved={onSaved}
        />
      ) : (
        <TaskDetailSheet
          open={sheetOpen}
          onOpenChange={handleSheetOpenChange}
          task={selectedItem}
          taskStates={snapshot.itemStates}
          project={project}
          sprintWorkingDays={sprintWorkingDays}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
