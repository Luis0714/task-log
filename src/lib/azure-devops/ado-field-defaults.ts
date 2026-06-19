/** Única fuente de verdad para los defaults de campos ADO.
 *  Importar desde aquí — nunca repetir estas constantes en otros módulos. */
export const ADO_FIELD_DEFAULTS = {
  // Campos de scheduling (estándar en todos los procesos Scrum/Agile/CMMI)
  completedWorkField: "Microsoft.VSTS.Scheduling.CompletedWork",
  originalEstimateField: "Microsoft.VSTS.Scheduling.OriginalEstimate",
  activityField: "Microsoft.VSTS.Common.Activity",

  // Tipos de work item (Scrum — pueden variar por proceso)
  taskWorkItemType: "Task",
  bugWorkItemType: "Bug",
  backlogItemType: "Product Backlog Item",
} as const;
