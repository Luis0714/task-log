import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

export type AppliedTemplateFields = {
  taskTitle: string;
  description: string;
  activity: string;
  /**
   * String crudo para el campo "horas" del form (vacío = la plantilla no
   * fuerza horas; el usuario las tipea manualmente al aplicar).
   */
  hours: string;
};

/**
 * Aplica una plantilla a los campos editables de una fila bulk.
 *
 * Replica la lógica de `useApplyTemplate` (single form) pero sin acoplamiento
 * a react-hook-form: el llamador hace `onChange(id, applyTemplateToRow(...))`.
 *
 * La actividad sólo se aplica si está dentro de la lista permitida, igual que
 * en el formulario individual.
 *
 * Las horas se copian como string (formato decimal `1.5` o `0.25`). Si la
 * plantilla no tiene `defaultHours`, el campo queda vacío para que el usuario
 * lo complete — no se asume un valor por defecto.
 */
export function applyTemplateToRow(
  template: TimeLogTemplateDto,
  activities: readonly string[],
): AppliedTemplateFields {
  const activity =
    template.defaultActivity && activities.includes(template.defaultActivity)
      ? template.defaultActivity
      : "";

  return {
    taskTitle: template.defaultTitle,
    description: template.defaultDescription,
    activity,
    hours: template.defaultHours ? String(template.defaultHours) : "",
  };
}
