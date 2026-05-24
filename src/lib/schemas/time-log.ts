import { z } from "zod";

import {
  DEFAULT_TASK_ACTIVITY,
  DEFAULT_TASK_STATE,
  getDefaultWorkingDate,
  TASK_ACTIVITY_OPTIONS,
  TASK_STATE_OPTIONS,
} from "@/lib/time-log/task-constants";

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
  .min(1, "Selecciona una historia (PBI).")
  .refine((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0;
  }, "PBI inválido.");

export const timeLogContextStepSchema = z.object({
  project: z.string().trim().min(1, "Selecciona un proyecto."),
  team: z.string().trim().min(1, "Selecciona un equipo."),
  sprintPath: z.string().trim().min(1, "Selecciona un sprint."),
  pbiId: pbiIdField,
});

export const timeLogTaskStepSchema = z.object({
  taskTitle: z
    .string()
    .trim()
    .min(1, "Ingresa el título de la tarea.")
    .max(256, "Máximo 256 caracteres."),
  hours: hoursField,
  description: z.string().trim().max(2000, "Máximo 2000 caracteres."),
  activity: z.enum(TASK_ACTIVITY_OPTIONS, {
    message: "Selecciona una actividad.",
  }),
  workingDate: z
    .string()
    .trim()
    .min(1, "Selecciona la fecha de trabajo.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  taskState: z.enum(TASK_STATE_OPTIONS, {
    message: "Selecciona un estado.",
  }),
});

export const timeLogFormSchema = timeLogContextStepSchema.merge(timeLogTaskStepSchema);

export type TimeLogFormValues = z.infer<typeof timeLogFormSchema>;

export type CreateTaskPayload = {
  action: "create_task";
  pbiId: number;
  pbiTitle: string;
  title: string;
  hours: number;
  description: string;
  activity: (typeof TASK_ACTIVITY_OPTIONS)[number];
  workingDate: string;
  state: (typeof TASK_STATE_OPTIONS)[number];
  sprintPath: string;
  team: string;
  project: string;
};

export function createTimeLogFormDefaults(defaultProject = ""): TimeLogFormValues {
  return {
    project: defaultProject,
    team: "",
    sprintPath: "",
    pbiId: "",
    taskTitle: "",
    hours: "",
    description: "",
    activity: DEFAULT_TASK_ACTIVITY,
    workingDate: getDefaultWorkingDate(),
    taskState: DEFAULT_TASK_STATE,
  };
}

export const TIME_LOG_TASK_STEP_DEFAULTS: Pick<
  TimeLogFormValues,
  "taskTitle" | "hours" | "description" | "activity" | "workingDate" | "taskState"
> = {
  taskTitle: "",
  hours: "",
  description: "",
  activity: DEFAULT_TASK_ACTIVITY,
  workingDate: getDefaultWorkingDate(),
  taskState: DEFAULT_TASK_STATE,
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
    title: values.taskTitle.trim(),
    hours: Number.parseFloat(values.hours.replace(",", ".")),
    description: values.description.trim(),
    activity: values.activity,
    workingDate: values.workingDate,
    state: values.taskState,
  };
}
