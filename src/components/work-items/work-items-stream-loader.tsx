import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { WorkItemsSectionsStream } from "@/components/work-items/work-items-sections-stream";
import { WorkItemsSheetMetaServer } from "@/components/work-items/work-items-sheet-meta-server";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type WorkItemsStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  assignee: string;
};

export async function WorkItemsStreamLoader({
  sp,
  defaultProject,
  adoExecutionReady,
  assignee,
}: WorkItemsStreamLoaderProps) {
  const urlAssignee = assignee || DEFAULT_WORK_ITEM_FILTERS.assignee;

  return (
    <AdoCatalogGate
      adoExecutionReady={adoExecutionReady}
      defaultProject={defaultProject}
      searchParams={sp}
    >
      {(catalog) => (
        <WorkItemsSheetMetaServer
          catalog={catalog}
          assignee={urlAssignee}
        >
          <WorkItemsSectionsStream catalog={catalog} assignee={urlAssignee} />
        </WorkItemsSheetMetaServer>
      )}
    </AdoCatalogGate>
  );
}
