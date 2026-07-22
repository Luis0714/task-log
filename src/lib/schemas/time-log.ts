import { z } from "zod";

import { WORKING_TIME_PATTERN } from "@/lib/date/ado-datetime";
import { getDefaultWorkingTime } from "@/lib/time-log/task-constants";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import type { CreateTaskBatchItem } from "@/lib/schemas/agent";

const hoursField = z
  .string()
  .trim()
  .min(1, "Ingresa las horas trabajadas.")
  .refine((value) => {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 24;
  }, "Las horas deben ser mayores a 0 y como máximo 24.");

const pbiIdField = z
  .string()
  .trim()
  .min(1, "Selecciona una historia de usuario.")
  .refine((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0;
  }, "Historia de usuario inválida.");

export const timeLogContextStepSchema = z.object({
  project: z.string().trim().min(1, "Selecciona un proyecto."),
  team: z.string().trim().min(1, "Selecciona un equipo."),
  sprintPath: z.string().trim().min(1, "Selecciona un sprint."),
  pbiId: pbiIdField,
});

/**
 * Campos de detalle de una tarea, compartidos entre el formulario paso a paso
 * (`timeLogTaskStepSchema`) y el registro masivo (`bulkTaskSchema`).
 */
const taskDetailsSchema = z.object({
  taskTitle: z
    .string()
    .trim()
    .min(1, "Ingresa el título de la tarea.")
    .max(256, "Máximo 256 caracteres."),
  hours: hoursField,
  description: z
    .string()
    .trim()
    .min(1, "Ingresa la descripción de lo realizado.")
    .max(2000, "Máximo 2000 caracteres."),
  activity: z
    .string()
    .trim()
    .min(1, "Selecciona una actividad.")
    .max(100),
  workingDate: z
    .string()
    .trim()
    .min(1, "Selecciona la fecha de trabajo.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  workingTime: z
    .string()
    .trim()
    .min(1, "Indica la hora de trabajo.")
    .regex(WORKING_TIME_PATTERN, "Hora inválida (usa formato 24 h, p. ej. 09:30)."),
  taskState: z.string().trim().min(1, "Selecciona un estado."),
});

type TaskDetailsValues = z.infer<typeof taskDetailsSchema>;

function mapTaskDetails(values: TaskDetailsValues) {
  return {
    title: values.taskTitle.trim(),
    hours: Number.parseFloat(values.hours.replace(",", ".")),
    description: values.description.trim(),
    activity: values.activity.trim(),
    workingDate: values.workingDate,
    workingTime: values.workingTime,
    state: values.taskState,
  };
}

export const timeLogTaskStepSchema = taskDetailsSchema.extend({
  autoMarkAsDone: z.boolean(),
});

export const timeLogFormSchema = timeLogContextStepSchema.extend(
  timeLogTaskStepSchema.shape,
);

export type TimeLogFormValues = z.infer<typeof timeLogFormSchema>;

export type CreateTaskPayload = {
  action: "create_task";
  pbiId: number;
  pbiTitle: string;
  title: string;
  hours: number;
  description: string;
  activity?: string;
  workingDate: string;
  workingTime: string;
  state: string;
  markAsDone: boolean;
  sprintPath: string;
  team: string;
  project: string;
};

export function createTimeLogFormDefaults(
  defaultProject = "",
  catalog?: { project?: string; team?: string; sprintPath?: string },
): TimeLogFormValues {
  return {
    project: catalog?.project || defaultProject,
    team: catalog?.team ?? "",
    sprintPath: catalog?.sprintPath ?? "",
    pbiId: "",
    taskTitle: "",
    hours: "",
    description: "",
    activity: "",
    // El campo "Fecha de trabajo" se inicializa SIEMPRE con la fecha actual
    // del sistema: el caso de uso más frecuente es registrar el trabajo que
    // se está realizando en este instante. Ignoramos sprint, semana y filtros.
    workingDate: getTodayDateKey(),
    workingTime: getDefaultWorkingTime(),
    taskState: "",
    autoMarkAsDone: true,
  };
}

export const TIME_LOG_TASK_STEP_DEFAULTS: Pick<
  TimeLogFormValues,
  | "taskTitle"
  | "hours"
  | "description"
  | "activity"
  | "workingDate"
  | "workingTime"
  | "taskState"
  | "autoMarkAsDone"
> = {
  taskTitle: "",
  hours: "",
  description: "",
  activity: "",
  workingDate: getTodayDateKey(),
  workingTime: getDefaultWorkingTime(),
  taskState: "",
  autoMarkAsDone: true,
};

export function mapTimeLogFormToPayload(
  values: TimeLogFormValues,
  pbiTitle: string,
): CreateTaskPayload {
  return {
    action: "create_task",
    project: values.project.trim(),
    team: values.team.trim(),
    sprintPath: values.sprintPath.trim(),
    pbiId: Number.parseInt(values.pbiId, 10),
    pbiTitle,
    ...mapTaskDetails(values),
    markAsDone: values.autoMarkAsDone,
  };
}

/**
 * Schema por tarea dentro de una Historia de Usuario. NO incluye `pbiId`
 * porque ese dato vive en el `BulkGroup` padre; el mapper lo inyecta desde
 * el contexto al construir el payload final.
 */
export const bulkTaskSchema = taskDetailsSchema.extend({
  markAsDone: z.boolean(),
});

export type BulkTaskFormValues = z.infer<typeof bulkTaskSchema>;

export type BulkTaskFieldErrors = Partial<
  Record<keyof BulkTaskFormValues, string>
>;

/**
 * Mapea una tarea validada al payload que espera `createTasksBatchInAdo`.
 * El `pbiId` y `pbiTitle` se reciben desde el `BulkGroup` padre, no desde
 * los valores de la tarea.
 */
export function mapBulkTaskToTaskItem(
  values: BulkTaskFormValues,
  ctx: {
    pbiId: string;
    pbiTitle: string;
    project: string;
    team: string;
    sprintPath: string;
  },
): CreateTaskBatchItem {
  return {
    pbiId: Number.parseInt(ctx.pbiId, 10),
    pbiTitle: ctx.pbiTitle,
    ...mapTaskDetails(values),
    markAsDone: values.markAsDone,
    sprintPath: ctx.sprintPath.trim(),
    team: ctx.team.trim(),
  };
}
