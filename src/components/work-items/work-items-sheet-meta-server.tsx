import { WorkItemsSelectionHost } from "@/components/work-items/work-items-selection-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadWorkItemsBase } from "@/lib/work-items/load-work-items-base";
import { loadWorkItemsSheetMeta } from "@/lib/work-items/load-work-items-sheet-meta";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";
import type { ReactNode } from "react";

export type WorkItemsSheetMetaServerProps = {
  catalog: AdoCatalogSnapshot;
  assignee: string;
  currentUserDisplayName?: string | null;
  children: ReactNode;
};

export async function WorkItemsSheetMetaServer({
  catalog,
  assignee,
  currentUserDisplayName = null,
  children,
}: WorkItemsSheetMetaServerProps) {
  const [meta, base] = await Promise.all([
    loadWorkItemsSheetMeta(catalog),
    loadWorkItemsBase(catalog, assignee || DEFAULT_WORK_ITEM_FILTERS.assignee),
  ]);

  return (
    <WorkItemsSelectionHost
      sprintBugs={base.sprintBugs}
      backlogStates={meta.backlogStates}
      responsableFields={meta.responsableFields}
      project={catalog.project || null}
      team={catalog.team || null}
      currentUserDisplayName={currentUserDisplayName}
      members={meta.teamMembers}
    >
      {children}
    </WorkItemsSelectionHost>
  );
}
