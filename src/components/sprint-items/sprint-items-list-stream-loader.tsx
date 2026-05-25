import { Suspense } from "react";

import { SprintItemsListsServer } from "@/components/sprint-items/sprint-items-lists-server";
import { SprintItemsListSkeleton } from "@/components/skeletons/sprint-items-list-skeleton";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type SprintItemsListStreamLoaderProps = {
  kind: SprintItemsKind;
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  assignee: string;
};

export async function SprintItemsListStreamLoader({
  kind,
  sp,
  defaultProject,
  assignee,
}: SprintItemsListStreamLoaderProps) {
  const catalog = await loadAdoCatalog(defaultProject, sp);
  if (!catalog.sprintPath) return null;

  const suspenseKey = [catalog.project, catalog.team, catalog.sprintPath, assignee].join(
    "|",
  );

  return (
    <Suspense key={suspenseKey} fallback={<SprintItemsListSkeleton />}>
      <SprintItemsListsServer
        kind={kind}
        catalog={catalog}
        assignee={assignee || DEFAULT_WORK_ITEM_FILTERS.assignee}
      />
    </Suspense>
  );
}
