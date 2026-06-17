import { firstSprintDataError, loadSprintWorkItems } from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCurrentSprint } from "@/lib/dashboard/build-dashboard-metrics";
import {
  mapToDashboardWorkItems,
  selectInProgressItems,
} from "@/lib/dashboard/work-item-selectors";

export type DailySectionData = {
  inProgress: ReturnType<typeof selectInProgressItems>;
  sprintName: string;
};

export type DailySectionResult =
  | { ok: true; data: DailySectionData }
  | { ok: false; error: string };

export async function loadDailySectionData(
  catalog: AdoCatalogSnapshot,
): Promise<DailySectionResult> {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) {
    return { ok: false, error: "No hay un sprint activo en el catálogo." };
  }

  const workItems = await loadSprintWorkItems(
    ctx.project,
    ctx.sprintPath,
    ctx.assignee,
  );
  const error = firstSprintDataError(workItems);
  if (error) return { ok: false, error };

  const inProgress = selectInProgressItems(
    mapToDashboardWorkItems(workItems.data),
  );
  const currentSprint = resolveCurrentSprint(catalog);

  return {
    ok: true,
    data: {
      inProgress,
      sprintName: currentSprint?.name ?? "Sprint actual",
    },
  };
}