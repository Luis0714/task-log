import { z } from "zod";

export const WORK_ITEM_ASSIGNEE_ALL = "all";
export const WORK_ITEM_ASSIGNEE_ME = "me";

export const workItemFiltersSchema = z.object({
  search: z.string(),
  /** `all`, `me` o displayName de un miembro del equipo. */
  assignee: z.string(),
  state: z.string(),
});

export type WorkItemFilters = z.infer<typeof workItemFiltersSchema>;

export const DEFAULT_WORK_ITEM_FILTERS: WorkItemFilters = {
  search: "",
  assignee: WORK_ITEM_ASSIGNEE_ME,
  state: "",
};

export function isWorkItemAssigneeMe(assignee: string): boolean {
  return assignee === WORK_ITEM_ASSIGNEE_ME;
}

export function isWorkItemAssigneeAll(assignee: string): boolean {
  return assignee === WORK_ITEM_ASSIGNEE_ALL || assignee === "";
}

export function resolveWorkItemAssigneeLabel(
  assignee: string,
  members: Array<{ displayName: string }>,
): string {
  if (isWorkItemAssigneeAll(assignee)) return "Todos";
  if (isWorkItemAssigneeMe(assignee)) return "Asignados a mí";
  const member = members.find((item) => item.displayName === assignee);
  return member?.displayName ?? assignee;
}
