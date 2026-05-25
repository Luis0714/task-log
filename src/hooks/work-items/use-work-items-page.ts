"use client";

import { useEffect, useMemo } from "react";

import { useAdoBacklogStates } from "@/hooks/use-ado-backlog-states";
import { useAdoContextSelection } from "@/hooks/use-ado-context-selection";
import { useAdoSprintBugs } from "@/hooks/use-ado-sprint-bugs";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import { useAdoTeamMembers } from "@/hooks/use-ado-team-members";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import {
  collectWorkItemStates,
  filterWorkItemsByClientCriteria,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";
import {
  WORK_ITEM_ASSIGNEE_ALL,
  WORK_ITEM_ASSIGNEE_ME,
  isWorkItemAssigneeAll,
  isWorkItemAssigneeMe,
} from "@/lib/schemas/work-item-filters";

export type UseWorkItemsPageOptions = {
  adoExecutionReady: boolean;
  defaultProject: string | null;
};

export function useWorkItemsPage({
  adoExecutionReady,
  defaultProject,
}: UseWorkItemsPageOptions) {
  const {
    filters,
    setSearch,
    setAssignee,
    setState,
    resetFilters,
  } = useWorkItemFilters();

  const context = useAdoContextSelection({
    adoExecutionReady,
    defaultProject,
  });

  const { project, team, sprintPath } = context;

  const {
    members: teamMembers,
    loading: teamMembersLoading,
    error: teamMembersError,
  } = useAdoTeamMembers(project || undefined, team || undefined, adoExecutionReady);

  const { states: backlogStates } = useAdoBacklogStates(
    project || undefined,
    adoExecutionReady,
  );

  const {
    workItems: sprintWorkItems,
    loading: workItemsLoading,
    error: workItemsError,
  } = useAdoSprintWorkItems(
    project || undefined,
    sprintPath || undefined,
    filters.assignee,
    adoExecutionReady,
  );

  const {
    bugs: sprintBugs,
    loading: bugsLoading,
    error: bugsError,
  } = useAdoSprintBugs(
    project || undefined,
    sprintPath || undefined,
    WORK_ITEM_ASSIGNEE_ALL,
    adoExecutionReady,
  );

  const bugCountsByParentId = useMemo(
    () => buildBugCountsByParentId(sprintBugs),
    [sprintBugs],
  );

  const workItemStates = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const filterStates = useMemo(
    () =>
      workItemStates.length > 0 ? workItemStates : collectWorkItemStates(sprintWorkItems),
    [sprintWorkItems, workItemStates],
  );

  const filteredItems = useMemo(() => {
    const items = filterWorkItemsByClientCriteria(sprintWorkItems, {
      search: filters.search,
      state: filters.state,
    });
    return attachBugCounts(items, bugCountsByParentId);
  }, [bugCountsByParentId, filters.search, filters.state, sprintWorkItems]);

  const inProgress = useMemo(
    () => selectInProgressWorkItems(filteredItems),
    [filteredItems],
  );

  const upcoming = useMemo(
    () => selectUpcomingWorkItems(filteredItems),
    [filteredItems],
  );

  useEffect(() => {
    resetFilters();
  }, [resetFilters, sprintPath]);

  useEffect(() => {
    if (filters.state && !filterStates.includes(filters.state)) {
      setState("");
    }
  }, [filterStates, filters.state, setState]);

  useEffect(() => {
    const assignee = filters.assignee;
    if (isWorkItemAssigneeMe(assignee) || isWorkItemAssigneeAll(assignee)) return;
    if (teamMembersLoading) return;
    if (!teamMembers.some((member) => member.displayName === assignee)) {
      setAssignee(WORK_ITEM_ASSIGNEE_ME);
    }
  }, [filters.assignee, setAssignee, teamMembers, teamMembersLoading]);

  const currentSprint = useMemo(
    () => context.sprints.find((sprint) => sprint.path === sprintPath) ?? null,
    [context.sprints, sprintPath],
  );

  const { contextLoading, ...contextFields } = context;

  const loading = adoExecutionReady && (contextLoading || workItemsLoading || bugsLoading);

  const error =
    context.projectsError ??
    context.teamsError ??
    context.sprintsError ??
    workItemsError ??
    bugsError ??
    null;

  return {
    adoExecutionReady,
    loading,
    error,
    sprintName: currentSprint?.name ?? null,
    context: contextFields,
    filters: {
      values: filters,
      states: filterStates,
      members: teamMembers,
      membersLoading: teamMembersLoading,
      membersError: teamMembersError,
      totalCount: sprintWorkItems.length,
      filteredCount: filteredItems.length,
      onSearchChange: setSearch,
      onAssigneeChange: setAssignee,
      onStateChange: setState,
    },
    inProgress,
    upcoming,
    assigned: filteredItems,
  };
}
