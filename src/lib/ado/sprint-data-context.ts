import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

export type SprintDataContext = {
  project: string;
  team: string;
  sprintPath: string;
  assignee: string;
};

export function catalogToSprintContext(
  catalog: AdoCatalogSnapshot,
  assignee = WORK_ITEM_ASSIGNEE_ME,
): SprintDataContext | null {
  if (!catalog.project || !catalog.team || !catalog.sprintPath) return null;
  return {
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    assignee,
  };
}
