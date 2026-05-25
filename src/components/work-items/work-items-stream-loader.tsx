import { WorkItemsSectionsStream } from "@/components/work-items/work-items-sections-stream";
import { WorkItemsSheetMetaServer } from "@/components/work-items/work-items-sheet-meta-server";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type WorkItemsStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  assignee: string;
  currentUserDisplayName?: string | null;
};

export async function WorkItemsStreamLoader({
  sp,
  defaultProject,
  assignee,
  currentUserDisplayName = null,
}: WorkItemsStreamLoaderProps) {
  const catalog = await loadAdoCatalog(defaultProject, sp);
  if (!catalog.sprintPath) return null;

  const urlAssignee = assignee || DEFAULT_WORK_ITEM_FILTERS.assignee;

  return (
    <WorkItemsSheetMetaServer
      catalog={catalog}
      assignee={urlAssignee}
      currentUserDisplayName={currentUserDisplayName}
    >
      <WorkItemsSectionsStream catalog={catalog} assignee={urlAssignee} />
    </WorkItemsSheetMetaServer>
  );
}
