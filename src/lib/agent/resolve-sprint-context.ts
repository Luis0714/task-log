import "server-only";

import type { SprintContext } from "@/lib/agent/features/create-tasks";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadSprintNonWorkingDates } from "@/lib/ado/load-sprint-data";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import { firstSprintDataError } from "@/lib/ado/load-sprint-data";

export type ResolvedSprintContext =
  | { ok: true; context: SprintContext }
  | { ok: false; error: string };

export async function resolveSprintContextForCopilot(
  catalog: AdoCatalogSnapshot,
): Promise<ResolvedSprintContext> {
  const sprint = resolveCurrentSprint(catalog);
  if (!sprint || !sprint.startDate || !sprint.finishDate) {
    return { ok: false, error: "No hay un sprint activo con fechas en el catálogo." };
  }

  const nonWorkingPart = await loadSprintNonWorkingDates(
    catalog.project,
    catalog.team,
  );
  const nonWorkingError = firstSprintDataError(nonWorkingPart);
  if (nonWorkingError) {
    return { ok: false, error: nonWorkingError };
  }

  return {
    ok: true,
    context: {
      project: catalog.project,
      team: catalog.team,
      sprintPath: catalog.sprintPath,
      sprintStartDate: sprint.startDate,
      sprintFinishDate: sprint.finishDate,
      nonWorkingDates: nonWorkingPart.data,
    },
  };
}