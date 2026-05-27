import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { isValidLoggedHours } from "@/components/tasks/task-logged-hours-highlight";

export type TaskSummaryViewModel = {
  hasWorkingDate: boolean;
  hasEffort: boolean;
  hasState: boolean;
  hasAssignee: boolean;
  shouldShowLoggedHoursHighlight: boolean;
};

export function buildTaskSummaryViewModel(
  item: AdoWorkItemOptionDto,
  showLoggedHoursHighlight: boolean,
): TaskSummaryViewModel {
  return {
    hasWorkingDate: Boolean(item.workingDate),
    hasEffort: item.effort !== undefined,
    hasState: Boolean(item.state),
    hasAssignee: Boolean(item.assignedTo),
    shouldShowLoggedHoursHighlight: showLoggedHoursHighlight && isValidLoggedHours(item.loggedHours),
  };
}
