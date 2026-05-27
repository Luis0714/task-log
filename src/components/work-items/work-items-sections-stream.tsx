import { Suspense } from "react";

import { WorkItemsSectionServer } from "@/components/work-items/sections/work-items-section-server";
import {
  WorkItemsAllSectionSkeleton,
  WorkItemsDevelopedSectionSkeleton,
  WorkItemsInProgressSectionSkeleton,
  WorkItemsUpcomingSectionSkeleton,
} from "@/components/skeletons/work-items-section-skeletons";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type WorkItemsSectionsStreamProps = {
  catalog: AdoCatalogSnapshot;
  assignee: string;
};

export function WorkItemsSectionsStream({ catalog, assignee }: WorkItemsSectionsStreamProps) {
  const sectionKey = [catalog.project, catalog.team, catalog.sprintPath, assignee].join("|");

  return (
    <div className="flex flex-col gap-8">
      <Suspense
        key={`inProgress|${sectionKey}`}
        fallback={<WorkItemsInProgressSectionSkeleton />}
      >
        <WorkItemsSectionServer catalog={catalog} assignee={assignee} section="inProgress" />
      </Suspense>

      <Suspense key={`upcoming|${sectionKey}`} fallback={<WorkItemsUpcomingSectionSkeleton />}>
        <WorkItemsSectionServer catalog={catalog} assignee={assignee} section="upcoming" />
      </Suspense>

      <Suspense
        key={`developed|${sectionKey}`}
        fallback={<WorkItemsDevelopedSectionSkeleton />}
      >
        <WorkItemsSectionServer catalog={catalog} assignee={assignee} section="developed" />
      </Suspense>

      <Suspense key={`all|${sectionKey}`} fallback={<WorkItemsAllSectionSkeleton />}>
        <WorkItemsSectionServer catalog={catalog} assignee={assignee} section="filteredItems" />
      </Suspense>
    </div>
  );
}
