import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { DashboardSectionsStream } from "@/components/dashboard/dashboard-sections-stream";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type DashboardSectionsStreamLoaderProps = {
  readonly sp: AdoContextSearchParams;
  readonly defaultProject: string | null;
  readonly adoExecutionReady: boolean;
  readonly sprintDayKey: string;
};

export async function DashboardSectionsStreamLoader({
  sp,
  defaultProject,
  adoExecutionReady,
  sprintDayKey,
}: DashboardSectionsStreamLoaderProps) {
  return (
    <AdoCatalogGate
      adoExecutionReady={adoExecutionReady}
      defaultProject={defaultProject}
      searchParams={sp}
    >
      {(catalog) => (
        <DashboardSectionsStream catalog={catalog} sprintDayKey={sprintDayKey} />
      )}
    </AdoCatalogGate>
  );
}
