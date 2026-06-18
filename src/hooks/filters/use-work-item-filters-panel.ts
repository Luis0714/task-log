"use client";

import { useEffect, useMemo } from "react";

import { pruneAssigneeMemberSelection } from "@/lib/filters/prune-assignee-filter";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
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
  onStatesChange: (value: string[]) => void;
  onSaveAsDefaults?: () => Promise<void> | void;
};

export type UseWorkItemFiltersPanelOptions = {
  filters: WorkItemFilters;
  setSearch: (value: string) => void;
  setAssignee: (value: string) => void;
  setStates: (value: string[]) => void;
  resetFilters: () => void;
  sprintPath: string;
  items: AdoWorkItemOptionDto[];
  stateNames?: string[];
  members: AdoTeamMemberDto[];
  membersLoading: boolean;
  membersError: string | null;
  totalCount: number;
  filteredCount: number;
  onSaveAsDefaults?: () => Promise<void> | void;
};

export function useWorkItemFiltersPanel({
  filters,
  setSearch,
  setAssignee,
  setStates,
  resetFilters,
  sprintPath,
  items,
  stateNames,
  members,
  membersLoading,
  membersError,
  totalCount,
  filteredCount,
  onSaveAsDefaults,
}: UseWorkItemFiltersPanelOptions): WorkItemFiltersPanelBinding {
  const states = useMemo(() => {
    if (stateNames && stateNames.length > 0) return stateNames;
    return collectWorkItemStates(items);
  }, [items, stateNames]);

  useEffect(() => {
    resetFilters();
  }, [resetFilters, sprintPath]);

  useEffect(() => {
    const valid = filters.states.filter((state) => states.includes(state));
    if (valid.length !== filters.states.length) {
      setStates(valid);
    }
  }, [filters.states, setStates, states]);

  useEffect(() => {
    if (membersLoading) return;
    const nextAssignee = pruneAssigneeMemberSelection(filters.assignee, members);
    if (nextAssignee !== filters.assignee) {
      setAssignee(nextAssignee);
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
    onStatesChange: setStates,
    onSaveAsDefaults,
  };
}
