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

import { BugDetailSheet } from "@/components/bugs/bug-detail-sheet";
import { UserStoryDetailSheet } from "@/components/work-items/user-story-detail-sheet";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { AdoWorkItemOptionDto, AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";

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
  bugStates?: readonly AdoTaskStateDto[];
  responsableFields: readonly BacklogResponsableFieldDto[];
  sprintWorkingDays?: readonly SprintWorkingDay[];
  project: string | null;
  team: string | null;
  members: readonly AdoTeamMemberDto[];
  children: ReactNode;
};

export function WorkItemsSelectionHost({
  sprintBugs,
  backlogStates,
  bugStates = [],
  responsableFields,
  sprintWorkingDays = [],
  project,
  team,
  members,
  children,
}: WorkItemsSelectionHostProps) {
  const router = useRouter();
  const [selectedWorkItem, setSelectedWorkItem] = useState<DashboardWorkItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<AdoWorkItemOptionDto | null>(null);
  const [bugSheetOpen, setBugSheetOpen] = useState(false);

  const onItemClick = useCallback((item: DashboardWorkItem) => {
    setSelectedWorkItem(item);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedWorkItem(null);
  }, []);

  const handleBugClick = useCallback((bug: AdoWorkItemOptionDto) => {
    setSelectedBug(bug);
    setBugSheetOpen(true);
  }, []);

  const handleBugSheetOpenChange = useCallback((open: boolean) => {
    setBugSheetOpen(open);
    if (!open) setSelectedBug(null);
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
        members={members}
        onBugClick={handleBugClick}
        onSaved={() => router.refresh()}
      />
      <BugDetailSheet
        open={bugSheetOpen}
        onOpenChange={handleBugSheetOpenChange}
        bug={selectedBug}
        bugStates={bugStates}
        project={project}
        sprintWorkingDays={[...sprintWorkingDays]}
        onSaved={() => router.refresh()}
      />
    </WorkItemsSelectionContext.Provider>
  );
}
