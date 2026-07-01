"use client";

import { useCallback, useMemo, useState } from "react";

import { BugDetailSheet } from "@/components/bugs/bug-detail-sheet";
import { SprintLoggedHoursBadge } from "@/components/dashboard/metrics/sprint-logged-hours-badge";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintItemList, type SprintItemListSelection } from "@/components/sprint-items/sprint-item-list";
import { SprintItemsSortBar } from "@/components/sprint-items/sprint-items-sort-bar";
import { TaskDetailSheet, type ParentHuOption } from "@/components/tasks/task-detail-sheet";
import { BulkTasksActionsBar } from "@/components/tasks/bulk-tasks-actions-bar";
import { useSprintItemsLists } from "@/hooks/sprint-items/use-sprint-items-lists";
import { useSprintItemsSort } from "@/hooks/sprint-items/use-sprint-items-sort";
import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { sumTaskLoggedHours } from "@/lib/dashboard/task-hours";

function buildParentHuOptions(items: readonly AdoWorkItemOptionDto[]): ParentHuOption[] {
  const seen = new Set<number>();
  const options: ParentHuOption[] = [];
  for (const item of items) {
    if (item.parentId !== undefined && !seen.has(item.parentId)) {
      seen.add(item.parentId);
      options.push({ id: item.parentId, title: item.parentTitle ?? `HU #${item.parentId}` });
    }
  }
  return options;
}

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
  const { sort, setSort, nameSearch, setNameSearch, processedItems } =
    useSprintItemsSort(filteredItems);
  const copy = COPY[kind];
  const totalTaskHours = useMemo(
    () => (kind === "tasks" ? sumTaskLoggedHours(processedItems) : 0),
    [kind, processedItems],
  );

  const [selectedItem, setSelectedItem] = useState<AdoWorkItemOptionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );

  const parentHuOptions = useMemo(
    () => buildParentHuOptions(processedItems),
    [processedItems],
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
      setSelectedIds(new Set(processedItems.map((item) => item.id)));
    },
    [processedItems],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkCompleted = useCallback(() => {
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
        headerMiddle={
          <SprintItemsSortBar
            sort={sort}
            onSortChange={setSort}
            nameSearch={nameSearch}
            onNameSearchChange={setNameSearch}
          />
        }
        action={
          kind === "tasks" ? <SprintLoggedHoursBadge hours={totalTaskHours} /> : undefined
        }
      >
        {kind === "tasks" ? (
          <BulkTasksActionsBar
            project={project}
            selectedIds={Array.from(selectedIds)}
            stateNames={stateNames}
            parentHuOptions={parentHuOptions}
            workingDate={dayKey}
            onClear={handleClearSelection}
            onCompleted={handleBulkCompleted}
          />
        ) : null}
        <SprintItemList
          items={processedItems}
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
          parentHuOptions={parentHuOptions}
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
          parentHuOptions={parentHuOptions}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
