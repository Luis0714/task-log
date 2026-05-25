"use client";

import { useRouter } from "next/navigation";

import { WorkItemsLists } from "@/components/work-items/work-items-lists";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";

export type WorkItemsListsBridgeProps = {
  lists: WorkItemsListsSnapshot;
  project: string | null;
  team: string | null;
  currentUserDisplayName?: string | null;
  responsableFields: readonly BacklogResponsableFieldDto[];
};

export function WorkItemsListsBridge({
  lists,
  project,
  team,
  currentUserDisplayName = null,
  responsableFields,
}: WorkItemsListsBridgeProps) {
  const router = useRouter();
  const { filters } = useWorkItemsFiltersContext();

  if (lists.error) {
    return null;
  }

  return (
    <WorkItemsLists
      lists={lists}
      filters={filters}
      project={project}
      team={team}
      currentUserDisplayName={currentUserDisplayName}
      members={lists.teamMembers}
      responsableFields={responsableFields}
      onSaved={() => router.refresh()}
    />
  );
}
