/** Mensajes de validación del módulo de Solicitudes (novedades). */
export const SOLICITUD_ERROR_CODES = {
  projectRequired: "Selecciona un proyecto.",
  teamRequired: "Selecciona un equipo.",
  newsStoryRequired: "Selecciona la HU de novedades destino.",
  newsStoryNotLinked: "La HU seleccionada no está vinculada a este proyecto y equipo.",
  assigneeRequired: "Selecciona la persona asignada.",
  assigneeNotMember: "La persona asignada no es miembro del proyecto.",
  tipoRequired: "Selecciona el tipo de solicitud.",
  descriptionTooLong: "La descripción no puede superar los 500 caracteres.",
  timePositive: "El tiempo debe ser un número mayor a 0.",
  timeExceedsDay: "El horario supera el mismo día; ajusta el tiempo o las horas.",
  invalidDate: "La fecha debe tener formato YYYY-MM-DD.",
  invalidTime: "La hora debe tener formato HH:mm.",
  endBeforeStart: "La fecha fin no puede ser anterior a la fecha de inicio.",
  reintegroBeforeEnd: "El reintegro no puede ser anterior a la fecha fin.",
  titleRequired: "El título es obligatorio.",
  titleTooLong: "El título no puede superar los 150 caracteres.",
} as const;

export type SolicitudErrorCode = keyof typeof SOLICITUD_ERROR_CODES;
