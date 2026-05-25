import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBacklogItemStates,
  listTaskStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveTaskStateSelection } from "@/lib/time-log/task-state-utils";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TimeLogFormMeta = {
  teamMembers: AdoTeamMemberDto[];
  backlogStates: Awaited<ReturnType<typeof listBacklogItemStates>>;
  taskStates: AdoTaskStateDto[];
  defaultOpenTaskState: string | null;
  nonWorkingDates: string[];
};

const emptyMeta: TimeLogFormMeta = {
  teamMembers: [],
  backlogStates: [],
  taskStates: [],
  defaultOpenTaskState: null,
  nonWorkingDates: [],
};

export const loadTimeLogFormMeta = cache(async function loadTimeLogFormMeta(
  catalog: AdoCatalogSnapshot,
): Promise<TimeLogFormMeta> {
  if (!catalog.project || !catalog.team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  const scopedAuth = withAdoProject(caller.auth, catalog.project);
  const [teamMembers, backlogStates, taskStates, nonWorkingDates] = await Promise.all([
    listTeamMembers(scopedAuth, catalog.team),
    listBacklogItemStates(scopedAuth),
    listTaskStates(scopedAuth),
    loadNonWorkingDates(catalog.project, catalog.team),
  ]);

  const defaultOpenTaskState =
    taskStates.length > 0 ? resolveTaskStateSelection(taskStates, "") : null;

  return {
    teamMembers,
    backlogStates,
    taskStates,
    defaultOpenTaskState,
    nonWorkingDates,
  };
});
