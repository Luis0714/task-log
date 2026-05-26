import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

export function resolveCurrentSprint(catalog: AdoCatalogSnapshot): AdoSprintDto | null {
  return catalog.sprints.find((sprint) => sprint.path === catalog.sprintPath) ?? null;
}
