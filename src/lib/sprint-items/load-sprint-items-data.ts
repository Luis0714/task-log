import "server-only";

import { cache } from "react";

import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data-types";
import { loadSprintItemsList } from "@/lib/sprint-items/load-sprint-items-list";
import { loadSprintItemsListMeta } from "@/lib/sprint-items/load-sprint-items-list-meta";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data-types";

export type LoadSprintItemsDataInput = {
  kind: SprintItemsKind;
  project: string;
  team: string;
  sprintPath: string;
  assignee: string;
};

export const loadSprintItemsData = cache(async function loadSprintItemsData(
  input: LoadSprintItemsDataInput,
): Promise<SprintItemsDataSnapshot> {
  const catalog: AdoCatalogSnapshot = {
    project: input.project,
    team: input.team,
    sprintPath: input.sprintPath,
    projects: [],
    teams: [],
    sprints: [],
    defaultProject: null,
    defaultTeam: null,
    suggestedTeam: null,
    errors: { projects: null, teams: null, sprints: null },
  };

  const assignee = input.assignee || DEFAULT_WORK_ITEM_FILTERS.assignee;
  const [list, meta, nonWorkingDates] = await Promise.all([
    loadSprintItemsList(input.kind, catalog, assignee),
    loadSprintItemsListMeta(
      input.kind,
      input.project,
      input.team,
    ),
    loadNonWorkingDates(input.project, input.team),
  ]);

  return {
    items: list.items,
    itemStates: meta.itemStates,
    teamMembers: meta.teamMembers,
    nonWorkingDates,
    error: list.error,
  };
});
