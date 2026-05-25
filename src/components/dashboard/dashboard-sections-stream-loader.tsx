import { DashboardSectionsStream } from "@/components/dashboard/dashboard-sections-stream";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type DashboardSectionsStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  sprintDayKey: string;
};

export async function DashboardSectionsStreamLoader({
  sp,
  defaultProject,
  sprintDayKey,
}: DashboardSectionsStreamLoaderProps) {
  const catalog = await loadAdoCatalog(defaultProject, sp);
  if (!catalog.sprintPath) return null;

  return <DashboardSectionsStream catalog={catalog} sprintDayKey={sprintDayKey} />;
}
