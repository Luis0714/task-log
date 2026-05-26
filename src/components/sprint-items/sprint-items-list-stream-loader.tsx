import { Suspense } from "react";

import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { SprintItemsListsServer } from "@/components/sprint-items/sprint-items-lists-server";
import { SprintItemsListSkeleton } from "@/components/skeletons/sprint-items-list-skeleton";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type SprintItemsListStreamLoaderProps = {
  kind: SprintItemsKind;
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  assignee: string;
};

export async function SprintItemsListStreamLoader({
  kind,
  sp,
  defaultProject,
  adoExecutionReady,
  assignee,
}: SprintItemsListStreamLoaderProps) {
  const urlAssignee = assignee || DEFAULT_WORK_ITEM_FILTERS.assignee;

  return (
    <AdoCatalogGate
      adoExecutionReady={adoExecutionReady}
      defaultProject={defaultProject}
      searchParams={sp}
    >
      {(catalog) => {
        const suspenseKey = [
          catalog.project,
          catalog.team,
          catalog.sprintPath,
          urlAssignee,
        ].join("|");

        return (
          <Suspense key={suspenseKey} fallback={<SprintItemsListSkeleton />}>
            <SprintItemsListsServer
              kind={kind}
              catalog={catalog}
              assignee={urlAssignee}
            />
          </Suspense>
        );
      }}
    </AdoCatalogGate>
  );
}
