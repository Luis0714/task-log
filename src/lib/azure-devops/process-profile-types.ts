export type AdoProcessProfileFieldSource =
  | "env"
  | "default"
  | "discovered"
  | "session"
  | "manual";

/** Perfil de campos ADO validado para un proyecto concreto. */
export type AdoProcessProfile = {
  workingDateField: string;
  workingDateFieldSource: AdoProcessProfileFieldSource;
  /** Campos de fecha a solicitar en GET (primario + estándar). */
  workItemDateFieldNames: readonly string[];
  timezone: string;
  completedWorkField: string;
  originalEstimateField: string;
  /** null = campo no presente en este proyecto. */
  remainingWorkField: string | null;
  /** null = campo Activity desactivado para este proyecto. */
  activityField: string | null;
  taskWorkItemType: string;
  bugWorkItemType: string;
  backlogItemType: string;
  taskTodoState: string;
  taskDoneState: string;
};

