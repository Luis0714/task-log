import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { DashboardSectionsStream } from "@/components/dashboard/dashboard-sections-stream";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type DashboardSectionsStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  sprintDayKey: string;
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
