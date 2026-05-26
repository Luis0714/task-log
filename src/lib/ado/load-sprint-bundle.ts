import "server-only";

import { cache } from "react";

import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugs,
  loadSprintNonWorkingDates,
  loadSprintTasks,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { DashboardSprintBundle } from "@/lib/ado/types";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

const emptyBundle: DashboardSprintBundle = {
  workItems: [],
  bugs: [],
  tasks: [],
  backlogStates: [],
  nonWorkingDates: [],
  error: null,
};

export type LoadSprintBundleInput = {
  project: string;
  team: string;
  sprintPath: string;
  assignee?: string;
  includeDaysOff?: boolean;
};

export const loadSprintBundle = cache(async function loadSprintBundle(
  input: LoadSprintBundleInput,
): Promise<DashboardSprintBundle> {
  if (!input.project || !input.team || !input.sprintPath) return emptyBundle;

  const ctx = {
    project: input.project,
    team: input.team,
    sprintPath: input.sprintPath,
    assignee: input.assignee ?? WORK_ITEM_ASSIGNEE_ME,
  };

  const includeDaysOff = input.includeDaysOff ?? true;
  const [workItems, bugs, tasks, backlogStates, nonWorkingDates] = await Promise.all([
    loadSprintWorkItems(ctx),
    loadSprintBugs(ctx),
    loadSprintTasks(ctx),
    loadSprintBacklogStates(ctx.project),
    includeDaysOff ? loadSprintNonWorkingDates(ctx) : Promise.resolve({ data: [], error: null }),
  ]);

  const error = firstSprintDataError(workItems, bugs, tasks, backlogStates, nonWorkingDates);

  return {
    workItems: workItems.data,
    bugs: bugs.data,
    tasks: tasks.data,
    backlogStates: backlogStates.data,
    nonWorkingDates: nonWorkingDates.data,
    error,
  };
});

export function catalogToSprintBundleInput(
  catalog: AdoCatalogSnapshot,
  assignee = WORK_ITEM_ASSIGNEE_ME,
): LoadSprintBundleInput | null {
  const ctx = catalogToSprintContext(catalog, assignee);
  if (!ctx) return null;
  return {
    project: ctx.project,
    team: ctx.team,
    sprintPath: ctx.sprintPath,
    assignee: ctx.assignee,
    includeDaysOff: true,
  };
}
