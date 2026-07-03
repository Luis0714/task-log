import { formatAdoErrorMessage } from "@/lib/errors/parse-ado-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

const CREATED_BUT_NOT_DONE = /La tarea #(\d+) se creó, pero no se pudo marcar como Done: ([\s\S]*)/;

function mapRequiredFieldError(detail: string): string {
  if (detail.includes("Working Date") || detail.includes("WorkingDate")) {
    return USER_MESSAGES.fieldConfigRequired("Working Date");
  }
  if (detail.includes("Completed Work") || detail.includes("CompletedWork")) {
    return USER_MESSAGES.fieldConfigRequired("Completed Work");
  }
  return formatAdoErrorMessage(detail) || USER_MESSAGES.workItemUpdateFailed;
}

export function mapTaskCreateError(body: string): string {
  // "La tarea #X se creó, pero no se pudo marcar como Done: {ADO error}"
  const doneMatch = body.match(CREATED_BUT_NOT_DONE);
  if (doneMatch) {
    const taskId = doneMatch[1];
    const detail = doneMatch[2] ?? "";
    const reason = mapRequiredFieldError(detail);
    return `La tarea #${taskId} se creó, pero no pudo marcarse como Done. ${reason}`;
  }

  // Our own 422 for null fields ("no tiene configurado el campo …")
  if (body.includes("no tiene configurado el campo")) {
    return `${body} ${USER_MESSAGES.goToSettingsHint}`;
  }

  // TF401320 on a required field during creation
  if (body.includes("TF401320")) {
    return mapRequiredFieldError(body);
  }

  return formatAdoErrorMessage(body) || USER_MESSAGES.taskCreateFailed;
}
