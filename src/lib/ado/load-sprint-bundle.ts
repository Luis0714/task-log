import "server-only";

import { cache } from "react";

import type { DashboardSprintBundle } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listBacklogItemStates } from "@/lib/azure-devops/work-item-type-states";
import { listTeamNonWorkingDateKeys } from "@/lib/azure-devops/team-days-off";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  buildNonWorkingDateSet,
  parseNonWorkingDatesFromEnv,
} from "@/lib/dashboard/non-working-days";
import { listTasksInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
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
  const { project, team, sprintPath, assignee = WORK_ITEM_ASSIGNEE_ME, includeDaysOff = true } =
    input;

  if (!project || !team || !sprintPath) return emptyBundle;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyBundle;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const envDates = [...parseNonWorkingDatesFromEnv()];
    const [workItems, bugs, tasks, backlogStates, teamDaysOff] = await Promise.all([
      listWorkItemsInSprint(scopedAuth, sprintPath, { assignee }),
      listWorkItemsInSprint(scopedAuth, sprintPath, {
        assignee,
        workItemType: "Bug",
      }),
      listTasksInSprint(scopedAuth, sprintPath, { assignee }),
      listBacklogItemStates(scopedAuth),
      includeDaysOff
        ? listTeamNonWorkingDateKeys(scopedAuth, team).catch(() => [] as string[])
        : Promise.resolve([] as string[]),
    ]);

    const nonWorkingDates = includeDaysOff
      ? [...buildNonWorkingDateSet([{ dates: envDates }, { dates: teamDaysOff }])]
      : [];

    return {
      workItems,
      bugs,
      tasks,
      backlogStates,
      nonWorkingDates,
      error: null,
    };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return {
      ...emptyBundle,
      error: `No se pudieron cargar los datos del sprint. — ${detail}`,
    };
  }
});
