/**
 * Identificadores de scope (página/feature) donde el usuario puede guardar
 * sus filtros predeterminados. Para añadir un nuevo scope:
 *   1. Añadir el valor aquí (constante + union del tipo).
 *   2. Usar la constante desde la página correspondiente.
 * Cualquier cambio queda localizado a este archivo.
 */
export const USER_FILTER_SCOPES = {
  workItems: "work-items",
  timeLog: "time-log",
  dashboard: "dashboard",
  tasks: "tasks",
  bugs: "bugs",
  userHistories: "user-histories",
  newsStories: "news-stories",
} as const;

export type UserFilterScope =
  (typeof USER_FILTER_SCOPES)[keyof typeof USER_FILTER_SCOPES];

export const USER_FILTER_SCOPE_VALUES = Object.values(
  USER_FILTER_SCOPES,
) as UserFilterScope[];