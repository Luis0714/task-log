import { Suspense } from "react";

import { DashboardDeliverySectionServer } from "@/components/dashboard/sections/server/dashboard-delivery-section-server";
import { DashboardHoursSectionServer } from "@/components/dashboard/sections/server/dashboard-hours-section-server";
import { DashboardWorkflowSectionServer } from "@/components/dashboard/sections/server/dashboard-workflow-section-server";
import {
  DashboardDeliverySectionSkeleton,
  DashboardHoursSectionSkeleton,
  DashboardWorkflowSectionSkeleton,
} from "@/components/skeletons/dashboard-section-skeletons";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type DashboardSectionsStreamProps = {
  readonly catalog: AdoCatalogSnapshot;
  readonly sprintDayKey: string;
};

export function DashboardSectionsStream({
  catalog,
  sprintDayKey,
}: DashboardSectionsStreamProps) {
  // sprintDayKey excluido: las secciones lo resuelven internamente; solo project/team/sprint deben resetear el skeleton.
  const sectionKey = [
    catalog.project,
    catalog.team,
    catalog.sprintPath,
  ].join("|");

  return (
    <div className="flex flex-col gap-6">
      <Suspense key={`delivery|${sectionKey}`} fallback={<DashboardDeliverySectionSkeleton />}>
        <DashboardDeliverySectionServer catalog={catalog} />
      </Suspense>

      <Suspense key={`hours|${sectionKey}`} fallback={<DashboardHoursSectionSkeleton />}>
        <DashboardHoursSectionServer catalog={catalog} sprintDayKey={sprintDayKey} />
      </Suspense>

      <Suspense key={`workflow|${sectionKey}`} fallback={<DashboardWorkflowSectionSkeleton />}>
        <DashboardWorkflowSectionServer catalog={catalog} />
      </Suspense>
    </div>
  );
}
