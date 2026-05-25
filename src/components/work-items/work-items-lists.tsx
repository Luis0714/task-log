"use client";

import { useCallback, useState } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import { UserStoryDetailSheet } from "@/components/work-items/user-story-detail-sheet";
import { useWorkItemsLists } from "@/hooks/work-items/use-work-items-lists";
import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type WorkItemsListsProps = {
  lists: WorkItemsListsSnapshot;
  filters: WorkItemFilters;
  project: string | null;
  team: string | null;
  currentUserDisplayName?: string | null;
  members: WorkItemsListsSnapshot["teamMembers"];
  onSaved: () => void;
};

export function WorkItemsLists({
  lists,
  filters,
  project,
  team,
  currentUserDisplayName = null,
  members,
  onSaved,
}: WorkItemsListsProps) {
  const { filteredItems, inProgress, upcoming, developed } = useWorkItemsLists(
    lists,
    filters,
  );

  const [selectedWorkItem, setSelectedWorkItem] = useState<DashboardWorkItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleWorkItemClick = useCallback((item: DashboardWorkItem) => {
    setSelectedWorkItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedWorkItem(null);
  }, []);

  return (
    <>
      <DashboardSection
        title="Historias de usuario"
        description="Todas las historias que coinciden con los filtros."
      >
        <PbiList
          items={filteredItems}
          variant="compact"
          showHours
          emptyMessage="No hay historias de usuario que coincidan con los filtros."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Historias en progreso"
        description="Historias de usuario en estado Committed."
      >
        <PbiList
          items={inProgress}
          variant="featured"
          emptyMessage="No hay historias en Committed con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Próximas historias de usuario"
        description="Qué deberías hacer después, ordenadas por prioridad."
      >
        <PbiList
          items={upcoming}
          variant="compact"
          emptyMessage="No hay historias en New o Approved con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <DashboardSection
        title="Historias desarrolladas"
        description="En QA, Review PO, Stage o Done."
      >
        <PbiList
          items={developed}
          variant="compact"
          emptyMessage="No hay historias desarrolladas con los filtros actuales."
          onItemClick={handleWorkItemClick}
        />
      </DashboardSection>

      <UserStoryDetailSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        workItem={selectedWorkItem}
        bugs={lists.sprintBugs}
        backlogStates={lists.backlogStates}
        project={project}
        team={team}
        currentUserDisplayName={currentUserDisplayName}
        members={members}
        onSaved={onSaved}
      />
    </>
  );
}
