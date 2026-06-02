import { Suspense } from "react";

import { DashboardDailySectionServer } from "@/components/dashboard/sections/server/dashboard-daily-section-server";
import { DashboardDailySectionSkeleton } from "@/components/skeletons/dashboard-daily-section-skeleton";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

import { CopilotHistoryView } from "@/components/copilot/copilot-history-view";

export type CopilotHistoryViewWithDailyProps = {
  readonly catalog: AdoCatalogSnapshot | null;
};


export function CopilotHistoryViewWithDaily({ catalog }: CopilotHistoryViewWithDailyProps) {
  return (
    <CopilotHistoryView>
      {catalog ? (
        <Suspense
          key={`${catalog.project}|${catalog.team}|${catalog.sprintPath}`}
          fallback={<DashboardDailySectionSkeleton />}
        >
          <DashboardDailySectionServer catalog={catalog} />
        </Suspense>
      ) : null}
    </CopilotHistoryView>
  );
}
