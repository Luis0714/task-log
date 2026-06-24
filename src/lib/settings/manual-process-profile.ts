import type {
  AdoProcessProfile,
  AdoProcessProfileResponsableField,
} from "@/lib/azure-devops/process-profile-types";
import { buildWorkItemDateFieldNames } from "@/lib/azure-devops/working-date-field";

export type ManualProcessProfileInput = {
  workingDateField: string;
  timezone: string;
  // campos admin opcionales
  completedWorkField?: string | null;
  originalEstimateField?: string | null;
  remainingWorkField?: string | null;
  activityField?: string | null;
  taskWorkItemType?: string;
  bugWorkItemType?: string;
  backlogItemType?: string;
  taskTodoState?: string;
  taskDoneState?: string;
  /**
   * Si se pasa, reemplaza la lista de Responsables. Si no se pasa, conserva
   * los existentes. Para vaciar la lista, pasar `[]` explícitamente.
   */
  responsableFields?: readonly AdoProcessProfileResponsableField[];
};

export function applyManualProcessProfileChanges(
  current: AdoProcessProfile,
  input: ManualProcessProfileInput,
): AdoProcessProfile {
  const workingDateField = input.workingDateField.trim();
  const timezone = input.timezone.trim();

  return {
    workingDateField,
    workingDateFieldSource: "manual",
    workItemDateFieldNames: buildWorkItemDateFieldNames(workingDateField),
    timezone: timezone || current.timezone,
    completedWorkField: input.completedWorkField !== undefined
      ? (input.completedWorkField?.trim() || null)
      : current.completedWorkField,
    originalEstimateField: input.originalEstimateField !== undefined
      ? (input.originalEstimateField?.trim() || null)
      : current.originalEstimateField,
    remainingWorkField: input.remainingWorkField !== undefined ? input.remainingWorkField : current.remainingWorkField,
    activityField: input.activityField !== undefined ? input.activityField : current.activityField,
    taskWorkItemType: input.taskWorkItemType?.trim() || current.taskWorkItemType,
    bugWorkItemType: input.bugWorkItemType?.trim() || current.bugWorkItemType,
    backlogItemType: input.backlogItemType?.trim() || current.backlogItemType,
    taskTodoState: input.taskTodoState?.trim() ?? current.taskTodoState,
    taskDoneState: input.taskDoneState?.trim() ?? current.taskDoneState,
    responsableFields:
      input.responsableFields !== undefined
        ? input.responsableFields
        : current.responsableFields,
  };
}
