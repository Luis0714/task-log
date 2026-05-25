"use client";

import { useMemo } from "react";

import { useAdoBacklogStates } from "@/hooks/use-ado-backlog-states";
import { useAdoContextSelection } from "@/hooks/use-ado-context-selection";
import { useAdoSprintBugs } from "@/hooks/use-ado-sprint-bugs";
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import { useAdoTeamMembers } from "@/hooks/use-ado-team-members";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import {
  filterWorkItemsByClientCriteria,
  selectDevelopedWorkItems,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";
import { isSectionLoading } from "@/lib/dashboard/section-loading";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

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
    refetch: refetchWorkItems,
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

  const developed = useMemo(
    () => selectDevelopedWorkItems(filteredItems),
    [filteredItems],
  );

  const filtersPanel = useWorkItemFiltersPanel({
    filters,
    setSearch,
    setAssignee,
    setState,
    resetFilters,
    sprintPath,
    items: sprintWorkItems,
    stateNames: workItemStates,
    members: teamMembers,
    membersLoading: teamMembersLoading,
    membersError: teamMembersError,
    totalCount: sprintWorkItems.length,
    filteredCount: filteredItems.length,
  });

  const currentSprint = useMemo(
    () => context.sprints.find((sprint) => sprint.path === sprintPath) ?? null,
    [context.sprints, sprintPath],
  );

  const { contextLoading, ...contextFields } = context;

  const listsLoading = isSectionLoading(
    adoExecutionReady,
    contextLoading,
    workItemsLoading,
  );
  const filtersBusy = isSectionLoading(adoExecutionReady, contextLoading);

  const error =
    context.projectsError ??
    context.teamsError ??
    context.sprintsError ??
    workItemsError ??
    bugsError ??
    null;

  return {
    adoExecutionReady,
    listsLoading,
    filtersBusy,
    error,
    sprintName: currentSprint?.name ?? null,
    project: project || null,
    team: team || null,
    sprintBugs,
    backlogStates,
    refetchWorkItems,
    context: contextFields,
    filters: {
      values: filtersPanel.values,
      states: filtersPanel.states,
      members: filtersPanel.members,
      membersLoading: filtersPanel.membersLoading,
      membersError: filtersPanel.membersError,
      totalCount: filtersPanel.totalCount,
      filteredCount: filtersPanel.filteredCount,
      onSearchChange: filtersPanel.onSearchChange,
      onAssigneeChange: filtersPanel.onAssigneeChange,
      onStateChange: filtersPanel.onStateChange,
    },
    inProgress,
    upcoming,
    developed,
    assigned: filteredItems,
  };
}
