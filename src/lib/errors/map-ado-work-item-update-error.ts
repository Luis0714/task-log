import { formatAdoErrorMessage } from "@/lib/errors/parse-ado-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

/** Mensaje seguro para el usuario según la respuesta de ADO al actualizar un work item. */
export function mapAdoWorkItemUpdateError(
  status: number,
  body: string,
): string {
  if (status === 403) {
    return USER_MESSAGES.permissionsInsufficient;
  }

  const detail = body;

  if (detail.includes("Working Date") || detail.includes("Custom.WorkingDate")) {
    return USER_MESSAGES.workingDateRequired;
  }
  if (detail.includes("Completed Work") || detail.includes("CompletedWork")) {
    return USER_MESSAGES.completedWorkRequired;
  }
  if (detail.includes("Start Date") || detail.includes("StartDate")) {
    return USER_MESSAGES.startDateRequired;
  }
  if (detail.includes("Target Date") || detail.includes("TargetDate")) {
    return USER_MESSAGES.targetDateRequired;
  }
  if (detail.includes("Responsable") || detail.includes("Maquetacion")) {
    return USER_MESSAGES.responsablesRequired;
  }

  if (status === 400 && detail.trim()) {
    return formatAdoErrorMessage(detail);
  }

  return USER_MESSAGES.workItemUpdateFailed;
}
