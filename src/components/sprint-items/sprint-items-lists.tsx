"use client";

import { useCallback, useState } from "react";

import { BugDetailSheet } from "@/components/bugs/bug-detail-sheet";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintItemList } from "@/components/sprint-items/sprint-item-list";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { useSprintItemsLists } from "@/hooks/sprint-items/use-sprint-items-lists";
import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

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

  const [selectedItem, setSelectedItem] = useState<AdoWorkItemOptionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleItemClick = useCallback((item: AdoWorkItemOptionDto) => {
    setSelectedItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedItem(null);
  }, []);

  return (
    <>
      <DashboardSection title={copy.sectionTitle} description={copy.sectionDescription}>
        <SprintItemList
          items={filteredItems}
          emptyMessage={copy.emptyMessage}
          onItemClick={handleItemClick}
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
