import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

export type SprintDataContext = {
  project: string;
  team: string;
  sprintPath: string;
  sprintStartDate: string | null;
  sprintFinishDate: string | null;
  assignee: string;
};

export function catalogToSprintContext(
  catalog: AdoCatalogSnapshot,
  assignee = WORK_ITEM_ASSIGNEE_ME,
): SprintDataContext | null {
  if (!catalog.project || !catalog.team || !catalog.sprintPath) return null;
  const currentSprint = resolveCurrentSprint(catalog);
  return {
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    sprintStartDate: currentSprint?.startDate ?? null,
    sprintFinishDate: currentSprint?.finishDate ?? null,
    assignee,
  };
}
