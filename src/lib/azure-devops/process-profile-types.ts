export type AdoProcessProfileFieldSource =
  | "env"
  | "default"
  | "discovered"
  | "session"
  | "manual";

export type AdoProcessProfileResponsableField = {
  key: string;
  referenceName: string;
  label: string;
  defaultToCurrentUser: boolean;
};

/** Perfil de campos ADO validado para un proyecto concreto. */
export type AdoProcessProfile = {
  workingDateField: string;
  workingDateFieldSource: AdoProcessProfileFieldSource;
  /** Campos de fecha a solicitar en GET (primario + estándar). */
  workItemDateFieldNames: readonly string[];
  timezone: string;
  /** null = campo no presente en este proyecto. */
  completedWorkField: string | null;
  /** null = campo no presente en este proyecto. */
  originalEstimateField: string | null;
  /** null = campo no presente en este proyecto. */
  remainingWorkField: string | null;
  /** null = campo Activity desactivado para este proyecto. */
  activityField: string | null;
  taskWorkItemType: string;
  bugWorkItemType: string;
  backlogItemType: string;
  taskTodoState: string;
  taskDoneState: string;
  /**
   * Campos Responsable configurados por el admin en este proyecto.
   * Lista vacía = el proyecto no tiene Responsables configurados (cae a
   * discovery/env).
   */
  responsableFields: readonly AdoProcessProfileResponsableField[];
};

