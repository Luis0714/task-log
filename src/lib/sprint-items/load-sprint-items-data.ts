import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBugStates,
  listTaskStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import { listTasksInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type SprintItemsDataSnapshot = {
  items: AdoWorkItemOptionDto[];
  itemStates: AdoTaskStateDto[];
  teamMembers: Awaited<ReturnType<typeof listTeamMembers>>;
  nonWorkingDates: string[];
  error: string | null;
};

const emptySnapshot: SprintItemsDataSnapshot = {
  items: [],
  itemStates: [],
  teamMembers: [],
  nonWorkingDates: [],
  error: null,
};

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
  const { kind, project, team, sprintPath, assignee } = input;
  if (!project || !team || !sprintPath) return emptySnapshot;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptySnapshot;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const [items, itemStates, teamMembers, nonWorkingDates] = await Promise.all([
      kind === "tasks"
        ? listTasksInSprint(scopedAuth, sprintPath, { assignee })
        : listWorkItemsInSprint(scopedAuth, sprintPath, {
            assignee,
            workItemType: "Bug",
          }),
      kind === "tasks" ? listTaskStates(scopedAuth) : listBugStates(scopedAuth),
      listTeamMembers(scopedAuth, team),
      loadNonWorkingDates(project, team),
    ]);

    return {
      items,
      itemStates,
      teamMembers,
      nonWorkingDates,
      error: null,
    };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    const label = kind === "tasks" ? "tasks" : "bugs";
    return {
      ...emptySnapshot,
      error: `No se pudieron cargar las ${label} del sprint. — ${detail}`,
    };
  }
});
