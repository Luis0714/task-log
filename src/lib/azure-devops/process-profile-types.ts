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
};

/** Copia serializable en sesión (iron-session). */
export type StoredAdoProcessProfile = {
  organization: string;
  project: string;
  workingDateField: string;
  workingDateFieldSource: AdoProcessProfileFieldSource;
  workItemDateFieldNames: string[];
  timezone: string;
  savedAt: string;
};
