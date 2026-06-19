import type { AdoProcessProfileFieldSource } from "@/lib/azure-devops/process-profile-types";

export type SettingsFieldCopy = {
  label: string;
  shortHelp: string;
  usedIn: string;
  detail: string;
};

export const SETTINGS_PAGE_INTRO =
  "NeosView adapta la app a tu organización de Azure DevOps. Al conectarte detectamos tipos de trabajo y campos de tu proceso. Puedes revisar y ajustar todo aquí.";

export const SETTINGS_CONNECTION_SECTION = {
  title: "Conexión",
  description: "Cuenta y organización con la que NeosView habla con Azure DevOps.",
} as const;

export const SETTINGS_PROCESS_SECTION = {
  title: "Proceso de Azure DevOps",
  description:
    "Campos que usa NeosView al cargar el sprint, registrar tiempo y actualizar tareas.",
} as const;

export const WORKING_DATE_FIELD_COPY: SettingsFieldCopy = {
  label: "Campo de fecha de trabajo",
  shortHelp: "Día en el que registras el trabajo en una tarea.",
  usedIn: "Registro de horas, listado del sprint y agrupación por día.",
  detail:
    "En Azure DevOps cada organización puede usar un campo distinto (por ejemplo Working Date o Fecha de inicio). Elige uno de la lista: solo aparecen campos de fecha del tipo Task en tu proyecto.",
};

export const TIMEZONE_FIELD_COPY: SettingsFieldCopy = {
  label: "Zona horaria",
  shortHelp: "Cómo interpretamos fechas con hora desde Azure DevOps.",
  usedIn: "Dashboard y lectura de fechas en tareas.",
  detail:
    "Usa el identificador IANA de tu región (por ejemplo America/Bogota). Debe coincidir con la zona en la que ves las fechas en Azure DevOps.",
};

export const PROFILE_SOURCE_LABELS: Record<AdoProcessProfileFieldSource, string> = {
  env: "Variable de entorno del servidor",
  default: "Valor por defecto de NeosView",
  discovered: "Detectado de Azure DevOps",
  session: "Guardado al conectar",
  manual: "Personalizado por ti",
};

export function formatProfileSourceLabel(source: AdoProcessProfileFieldSource): string {
  return PROFILE_SOURCE_LABELS[source];
}

export const ADMIN_PROCESS_SECTION = {
  title: "Configuración de proceso",
  description:
    "Campos y tipos de work item que usa NeosView en este proyecto. Se auto-detectan al conectar y se aplican a todos los usuarios.",
} as const;

export const COMPLETED_WORK_FIELD_COPY: SettingsFieldCopy = {
  label: "Campo de horas trabajadas",
  shortHelp: "Referencia del campo donde se registran las horas completadas.",
  usedIn: "Registro de tiempo y creación de tareas.",
  detail:
    "Normalmente Microsoft.VSTS.Scheduling.CompletedWork. Cámbialo si tu proceso usa un campo personalizado para las horas.",
};

export const ORIGINAL_ESTIMATE_FIELD_COPY: SettingsFieldCopy = {
  label: "Campo de estimación inicial",
  shortHelp: "Campo donde se guarda la estimación al crear la tarea.",
  usedIn: "Creación de tareas.",
  detail: "Normalmente Microsoft.VSTS.Scheduling.OriginalEstimate.",
};

export const ACTIVITY_FIELD_COPY: SettingsFieldCopy = {
  label: "Campo de actividad",
  shortHelp: "Campo de categoría de trabajo (Development, QA, Design…).",
  usedIn: "Creación de tareas. Dejar vacío para desactivar.",
  detail:
    "Normalmente Microsoft.VSTS.Common.Activity. Si tu proceso no usa este campo déjalo vacío.",
};

export const TASK_WIT_COPY: SettingsFieldCopy = {
  label: "Tipo de work item Tarea",
  shortHelp: "Nombre del tipo de work item que representa una tarea.",
  usedIn: "Creación de tareas y consultas WIQL.",
  detail: "Normalmente Task. Algunos procesos lo llaman Tarea u otro nombre.",
};

export const BUG_WIT_COPY: SettingsFieldCopy = {
  label: "Tipo de work item Bug",
  shortHelp: "Nombre del tipo de work item para bugs.",
  usedIn: "Listado de bugs del sprint.",
  detail: "Normalmente Bug.",
};

export const BACKLOG_WIT_COPY: SettingsFieldCopy = {
  label: "Tipo de work item Backlog",
  shortHelp: "Nombre del tipo de historia de usuario o PBI.",
  usedIn: "Listado del sprint y creación de tareas.",
  detail: "Normalmente Product Backlog Item o User Story.",
};

export const TASK_TODO_STATE_COPY: SettingsFieldCopy = {
  label: "Estado inicial de tarea",
  shortHelp: "Estado que se asigna al crear una tarea.",
  usedIn: "Creación de tareas.",
  detail: "Normalmente To Do o New. Se auto-detecta según los estados disponibles.",
};

export const TASK_DONE_STATE_COPY: SettingsFieldCopy = {
  label: "Estado completado de tarea",
  shortHelp: "Estado que se asigna al marcar una tarea como hecha.",
  usedIn: "Cierre de tareas al registrar tiempo.",
  detail: "Normalmente Closed o Done.",
};
