"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { UserStoryDetailSheet } from "@/components/work-items/user-story-detail-sheet";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { AdoWorkItemOptionDto, AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";

export type WorkItemsSelectionContextValue = {
  onItemClick: (item: DashboardWorkItem) => void;
};

const WorkItemsSelectionContext = createContext<WorkItemsSelectionContextValue | null>(
  null,
);

export function useWorkItemsSelection() {
  const ctx = useContext(WorkItemsSelectionContext);
  if (!ctx) {
    throw new Error("useWorkItemsSelection debe usarse dentro de WorkItemsSelectionHost");
  }
  return ctx;
}

export type WorkItemsSelectionHostProps = {
  sprintBugs: readonly AdoWorkItemOptionDto[];
  backlogStates: readonly AdoTaskStateDto[];
  responsableFields: readonly BacklogResponsableFieldDto[];
  project: string | null;
  team: string | null;
  currentUserDisplayName?: string | null;
  members: readonly AdoTeamMemberDto[];
  children: ReactNode;
};

export function WorkItemsSelectionHost({
  sprintBugs,
  backlogStates,
  responsableFields,
  project,
  team,
  currentUserDisplayName = null,
  members,
  children,
}: WorkItemsSelectionHostProps) {
  const router = useRouter();
  const [selectedWorkItem, setSelectedWorkItem] = useState<DashboardWorkItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const onItemClick = useCallback((item: DashboardWorkItem) => {
    setSelectedWorkItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedWorkItem(null);
  }, []);

  const value = useMemo(() => ({ onItemClick }), [onItemClick]);

  return (
    <WorkItemsSelectionContext.Provider value={value}>
      {children}
      <UserStoryDetailSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        workItem={selectedWorkItem}
        bugs={sprintBugs}
        backlogStates={backlogStates}
        responsableFields={responsableFields}
        project={project}
        team={team}
        currentUserDisplayName={currentUserDisplayName}
        members={members}
        onSaved={() => router.refresh()}
      />
    </WorkItemsSelectionContext.Provider>
  );
}
