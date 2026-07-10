export const ASSIGNMENT_ERROR_CODES = {
  roleRequired: "role_required",
  projectRequired: "project_required",
  personRequired: "person_required",
  pctRequired: "pct_required",
  pctRange: "pct_range",
  pctInteger: "pct_integer",
  startInPast: "start_in_past",
  endBeforeStart: "end_before_start",
  overlapSameProject: "overlap_same_project",
  over100: "over_100",
  conflictProject: "conflict_project",
  notFound: "not_found",
  unauthorized: "unauthorized",
} as const;

export type AssignmentErrorKey = keyof typeof ASSIGNMENT_ERROR_CODES;
export type AssignmentErrorCode =
  (typeof ASSIGNMENT_ERROR_CODES)[AssignmentErrorKey];

export const ASSIGNMENT_HTTP_STATUS: Record<AssignmentErrorKey, number> = {
  roleRequired: 400,
  projectRequired: 400,
  personRequired: 400,
  pctRequired: 400,
  pctRange: 400,
  pctInteger: 400,
  startInPast: 400,
  endBeforeStart: 400,
  overlapSameProject: 409,
  over100: 409,
  conflictProject: 409,
  notFound: 404,
  unauthorized: 403,
};

export const ASSIGNMENT_USER_MESSAGES: Record<AssignmentErrorKey, string> = {
  roleRequired: "Selecciona el rol de la persona.",
  projectRequired: "Selecciona un proyecto.",
  personRequired: "Selecciona la persona a asignar.",
  pctRequired: "Ingresa el porcentaje de asignación.",
  pctRange: "El porcentaje debe estar entre 1 y 100.",
  pctInteger: "El porcentaje debe ser un número entero.",
  startInPast: "No se permiten asignaciones con fecha de inicio anterior a hoy.",
  endBeforeStart:
    "La fecha de fin de vigencia debe ser igual o posterior a la fecha de inicio.",
  overlapSameProject:
    "Ya existe una asignación vigente de esta persona en ese proyecto que se cruza con las fechas.",
  over100:
    "La suma de asignaciones vigentes supera el 100%. Ajusta el porcentaje.",
  conflictProject:
    "No se pudo guardar por un conflicto con otra asignación. Actualiza la lista e inténtalo de nuevo.",
  notFound: "La asignación ya no existe. Actualiza la página.",
  unauthorized: "No tienes permisos para modificar asignaciones.",
};

export function isAssignmentErrorKey(value: unknown): value is AssignmentErrorKey {
  return (
    typeof value === "string" &&
    Object.hasOwn(ASSIGNMENT_ERROR_CODES, value)
  );
}

export function isAssignmentErrorCode(
  value: unknown,
): value is AssignmentErrorCode {
  return typeof value === "string" && value in ASSIGNMENT_ERROR_CODES;
}
