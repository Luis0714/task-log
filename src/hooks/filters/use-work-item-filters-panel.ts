"use client";

import { useEffect, useMemo } from "react";

import { assigneeMatchesMember } from "@/lib/filters/person-name";
import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  parseAssigneeFilter,
  serializeAssigneeFilter,
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
  onStatesChange: (value: string[]) => void;
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
}: UseWorkItemFiltersPanelOptions): WorkItemFiltersPanelBinding {
  const states = useMemo(() => {
    if (stateNames && stateNames.length > 0) return stateNames;
    return collectWorkItemStates(items);
  }, [items, stateNames]);

  const membersForFilter = useMemo(
    () => mergeTeamMembersWithWorkItemAssignees(members, items),
    [items, members],
  );

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
    const assigneeFilter = parseAssigneeFilter(filters.assignee);
    if (assigneeFilter.kind !== "members") return;
    if (membersLoading || membersForFilter.length === 0) return;

    const valid = assigneeFilter.names.filter((name) =>
      assigneeMatchesMember(membersForFilter, name),
    );
    if (valid.length === assigneeFilter.names.length) return;
    if (valid.length === 0) return;

    setAssignee(serializeAssigneeFilter({ kind: "members", names: valid }));
  }, [filters.assignee, membersForFilter, membersLoading, setAssignee]);

  return {
    values: filters,
    states,
    members: membersForFilter,
    membersLoading,
    membersError,
    totalCount,
    filteredCount,
    onSearchChange: setSearch,
    onAssigneeChange: setAssignee,
    onStatesChange: setStates,
  };
}
