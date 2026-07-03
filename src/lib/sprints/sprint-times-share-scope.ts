/** Contexto mínimo para compartir tiempos desde la sección del dashboard. */
export type SprintTimesShareScope = {
  project: string;
  team: string;
  sprintPath: string;
  sprintName: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
  goalOnly: boolean;
  hiddenAssignees?: readonly string[];
};
