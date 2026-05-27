"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import {
  WORK_ITEM_ASSIGNEE_ME,
  parseAssigneeFilter,
  resolveWorkItemAssigneeLabel,
  serializeAssigneeSelection,
} from "@/lib/schemas/work-item-filters";

export type UseWorkItemAssigneeFilterStateOptions = {
  assignee: string;
  members: AdoTeamMemberDto[];
  membersLoading?: boolean;
  onAssigneeChange: (value: string) => void;
};

function resolveDefaultAssignee(value: string): string {
  return value.trim() ? value : WORK_ITEM_ASSIGNEE_ME;
}

export function useWorkItemAssigneeFilterState({
  assignee,
  members,
  membersLoading = false,
  onAssigneeChange,
}: UseWorkItemAssigneeFilterStateOptions) {
  const [optimisticAssignee, setOptimisticAssignee] = useState(
    resolveDefaultAssignee(assignee),
  );

  useEffect(() => {
    setOptimisticAssignee(resolveDefaultAssignee(assignee));
  }, [assignee]);

  const assigneeFilter = parseAssigneeFilter(optimisticAssignee);
  const isAll = assigneeFilter.kind === "all";
  const includeMe =
    assigneeFilter.kind === "selection" && assigneeFilter.includeMe;
  const selectedMembers =
    assigneeFilter.kind === "selection" ? assigneeFilter.names : [];

  const selectedSet = useMemo(
    () => new Set(selectedMembers),
    [selectedMembers],
  );

  const triggerLabel = membersLoading
    ? "Cargando miembros..."
    : resolveWorkItemAssigneeLabel(optimisticAssignee, members);

  const commitAssignee = (nextAssignee: string) => {
    setOptimisticAssignee(nextAssignee);
    onAssigneeChange(nextAssignee);
  };

  const applySelection = (includeMeNext: boolean, names: readonly string[]) => {
    if (names.length === 0 && !includeMeNext) {
      commitAssignee(WORK_ITEM_ASSIGNEE_ME);
      return;
    }
    commitAssignee(
      serializeAssigneeSelection({ includeMe: includeMeNext, names }),
    );
  };

  const toggleMe = (checked: boolean) => {
    if (isAll) {
      applySelection(checked, []);
      return;
    }
    applySelection(checked, selectedMembers);
  };

  const toggleMember = (displayName: string, checked: boolean) => {
    if (isAll) {
      applySelection(false, checked ? [displayName] : []);
      return;
    }

    const next = checked
      ? [...selectedMembers, displayName]
      : selectedMembers.filter((name) => name !== displayName);
    applySelection(includeMe, next);
  };

  return {
    includeMe,
    isAll,
    selectedSet,
    triggerLabel,
    commitAssignee,
    toggleMe,
    toggleMember,
  };
}
