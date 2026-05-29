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
