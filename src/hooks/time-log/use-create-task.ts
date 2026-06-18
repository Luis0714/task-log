"use client";

import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { createTaskInAdo } from "@/lib/time-log/create-task-client";
import { resetTaskStepFields } from "@/lib/time-log/form-selection";
import {
  TIME_LOG_TASK_STEP_DEFAULTS,
  mapTimeLogFormToPayload,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";
import { getDefaultWorkingTime } from "@/lib/time-log/task-constants";
import { appToast } from "@/lib/toast";

type UseCreateTaskOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  appendHistory: (entry: CopilotHistoryEntry) => void;
  isTaskCreationMode: boolean;
  getDefaultTaskState: () => string;
  getDefaultCompletedTaskState: () => string;
  getDefaultWorkingDate: () => string;
};

function clearTaskFields(
  form: UseFormReturn<TimeLogFormValues>,
  getDefaultTaskState: () => string,
  getDefaultCompletedTaskState: () => string,
  isTaskCreationMode: boolean,
  getDefaultWorkingDate: () => string,
) {
  form.setValue("taskTitle", "");
  form.setValue("hours", "");
  form.setValue("description", "");
  form.setValue("activity", TIME_LOG_TASK_STEP_DEFAULTS.activity);
  form.setValue("workingDate", getDefaultWorkingDate());
  form.setValue("workingTime", getDefaultWorkingTime());
  form.setValue(
    "taskState",
    isTaskCreationMode
      ? getDefaultTaskState()
      : getDefaultCompletedTaskState() || getDefaultTaskState(),
  );
  form.setValue("autoMarkAsDone", TIME_LOG_TASK_STEP_DEFAULTS.autoMarkAsDone);
  resetTaskStepFields(form);
}

export function useCreateTask({
  form,
  appendHistory,
  isTaskCreationMode,
  getDefaultTaskState,
  getDefaultCompletedTaskState,
  getDefaultWorkingDate,
}: UseCreateTaskOptions) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (values: TimeLogFormValues, selectedPbi: AdoWorkItemOptionDto | null) => {
      setError(null);
      setLoading(true);

      // Defensa en profundidad: en modo time-log forzamos la creación como
      // Done, aunque el form haya sido manipulado manualmente.
      const payloadValues: TimeLogFormValues = isTaskCreationMode
        ? values
        : {
            ...values,
            autoMarkAsDone: true,
            taskState: getDefaultCompletedTaskState() || values.taskState,
          };

      const pbiTitle = selectedPbi?.title ?? `Historia #${payloadValues.pbiId}`;
      const payload = mapTimeLogFormToPayload(payloadValues, pbiTitle);

      try {
        const result = await createTaskInAdo(payload);

        if (!result.ok) {
          setError(result.message);
          appToast.error("No se pudo crear la tarea en Azure DevOps.", {
            description: result.message,
          });
          appendHistory({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            workingDate: payload.workingDate,
            summary: `Tarea en historia #${payload.pbiId} +${payload.hours}h (falló)`,
            ok: false,
          });
          return;
        }

        clearTaskFields(
          form,
          getDefaultTaskState,
          getDefaultCompletedTaskState,
          isTaskCreationMode,
          getDefaultWorkingDate,
        );
        const doneNote = result.markedAsDone ? " · marcada como Done" : "";
        appToast.success(`Tarea creada: #${result.taskId}`, {
          description: `${payload.title} · ${payload.hours}h · Historia #${payload.pbiId}${doneNote}`,
        });
        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          workingDate: payload.workingDate,
          summary: `Tarea #${result.taskId} +${payload.hours}h · Historia #${payload.pbiId}${doneNote}`,
          ok: true,
        });
      } catch {
        const message = "No se pudo ejecutar la acción.";
        setError(message);
        appToast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [
      appendHistory,
      form,
      getDefaultCompletedTaskState,
      getDefaultTaskState,
      getDefaultWorkingDate,
      isTaskCreationMode,
    ],
  );

  return { error, loading, submit };
}
