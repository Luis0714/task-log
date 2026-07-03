import type { AdoCatalogSnapshot } from "@/lib/ado/types";

type AdoContextUrlState = {
  project?: string | null;
  team?: string | null;
  sprint?: string | null;
};

export function resolveAdoContextUrlSyncTarget(
  catalog: Pick<AdoCatalogSnapshot, "project" | "team" | "sprintPath" | "sprints">,
  url: AdoContextUrlState,
): { shouldSync: boolean; sprintPath: string } | null {
  if (!catalog.project || !catalog.team || !catalog.sprintPath) {
    return null;
  }

  const urlSprintIsValid = Boolean(
    url.sprint && catalog.sprints.some((sprint) => sprint.path === url.sprint),
  );
  const sprintPath = urlSprintIsValid ? url.sprint! : catalog.sprintPath;

  const shouldSync =
    url.project !== catalog.project ||
    url.team !== catalog.team ||
    url.sprint !== sprintPath;

  return { shouldSync, sprintPath };
}
