import "server-only";

import { cache } from "react";

import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBacklogItemStates,
  listTaskStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveTaskStateSelection } from "@/lib/time-log/task-state-utils";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type {
  AdoTaskStateDto,
  AdoTeamMemberDto,
  AdoWorkItemOptionDto,
} from "@/lib/schemas/ado-catalog";

export type TimeLogServerBaseline = {
  catalog: AdoCatalogSnapshot;
  teamMembers: AdoTeamMemberDto[];
  backlogStates: Awaited<ReturnType<typeof listBacklogItemStates>>;
  taskStates: AdoTaskStateDto[];
  defaultOpenTaskState: string | null;
  nonWorkingDates: string[];
};

export const loadTimeLogBaseline = cache(async function loadTimeLogBaseline(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
): Promise<TimeLogServerBaseline> {
  const catalog = await loadAdoCatalog(preferredProject, searchParams);

  if (!catalog.project || !catalog.team) {
    return {
      catalog,
      teamMembers: [],
      backlogStates: [],
      taskStates: [],
      defaultOpenTaskState: null,
      nonWorkingDates: [],
    };
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return {
      catalog,
      teamMembers: [],
      backlogStates: [],
      taskStates: [],
      defaultOpenTaskState: null,
      nonWorkingDates: [],
    };
  }

  const scopedAuth = withAdoProject(caller.auth, catalog.project);
  const [teamMembers, backlogStates, taskStates, nonWorkingDates] = await Promise.all([
    listTeamMembers(scopedAuth, catalog.team),
    listBacklogItemStates(scopedAuth),
    listTaskStates(scopedAuth),
    loadNonWorkingDates(catalog.project, catalog.team),
  ]);

  const defaultOpenTaskState =
    taskStates.length > 0
      ? resolveTaskStateSelection(taskStates, "")
      : null;

  return {
    catalog,
    teamMembers,
    backlogStates,
    taskStates,
    defaultOpenTaskState,
    nonWorkingDates,
  };
});

export type TimeLogPbisSnapshot = {
  sprintPbis: AdoWorkItemOptionDto[];
  error: string | null;
};
