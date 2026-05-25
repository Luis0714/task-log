"use client";

import { useEffect, useMemo } from "react";

import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  WORK_ITEM_ASSIGNEE_ME,
  isWorkItemAssigneeAll,
  isWorkItemAssigneeMe,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";
import { collectWorkItemStates } from "@/lib/azure-devops/work-items-filters";

export type WorkItemFiltersPanelBinding = {
  values: WorkItemFilters;
  states: string[];
  members: AdoTeamMemberDto[];
  membersLoading: boolean;
  membersError: string | null;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onStateChange: (value: string) => void;
};

export type UseWorkItemFiltersPanelOptions = {
  filters: WorkItemFilters;
  setSearch: (value: string) => void;
  setAssignee: (value: string) => void;
  setState: (value: string) => void;
  resetFilters: () => void;
  sprintPath: string;
  items: AdoWorkItemOptionDto[];
  stateNames?: string[];
  members: AdoTeamMemberDto[];
  membersLoading: boolean;
  membersError: string | null;
  totalCount: number;
  filteredCount: number;
};

export function useWorkItemFiltersPanel({
  filters,
  setSearch,
  setAssignee,
  setState,
  resetFilters,
  sprintPath,
  items,
  stateNames,
  members,
  membersLoading,
  membersError,
  totalCount,
  filteredCount,
}: UseWorkItemFiltersPanelOptions): WorkItemFiltersPanelBinding {
  const states = useMemo(() => {
    if (stateNames && stateNames.length > 0) return stateNames;
    return collectWorkItemStates(items);
  }, [items, stateNames]);

  useEffect(() => {
    resetFilters();
  }, [resetFilters, sprintPath]);

  useEffect(() => {
    if (filters.state && !states.includes(filters.state)) {
      setState("");
    }
  }, [filters.state, setState, states]);

  useEffect(() => {
    const assignee = filters.assignee;
    if (isWorkItemAssigneeMe(assignee) || isWorkItemAssigneeAll(assignee)) return;
    if (membersLoading) return;
    if (!members.some((member) => member.displayName === assignee)) {
      setAssignee(WORK_ITEM_ASSIGNEE_ME);
    }
  }, [filters.assignee, members, membersLoading, setAssignee]);

  return {
    values: filters,
    states,
    members,
    membersLoading,
    membersError,
    totalCount,
    filteredCount,
    onSearchChange: setSearch,
    onAssigneeChange: setAssignee,
    onStateChange: setState,
  };
}
