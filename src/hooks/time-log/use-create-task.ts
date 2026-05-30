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
import { appToast } from "@/lib/toast";

type UseCreateTaskOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  appendHistory: (entry: CopilotHistoryEntry) => void;
  getDefaultTaskState: () => string;
  getDefaultWorkingDate: () => string;
};

function clearTaskFields(
  form: UseFormReturn<TimeLogFormValues>,
  getDefaultTaskState: () => string,
  getDefaultWorkingDate: () => string,
) {
  form.setValue("taskTitle", "");
  form.setValue("hours", "");
  form.setValue("description", "");
  form.setValue("activity", TIME_LOG_TASK_STEP_DEFAULTS.activity);
  form.setValue("workingDate", getDefaultWorkingDate());
  form.setValue("taskState", getDefaultTaskState());
  form.setValue("autoMarkAsDone", TIME_LOG_TASK_STEP_DEFAULTS.autoMarkAsDone);
  resetTaskStepFields(form);
}

export function useCreateTask({
  form,
  appendHistory,
  getDefaultTaskState,
  getDefaultWorkingDate,
}: UseCreateTaskOptions) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (values: TimeLogFormValues, selectedPbi: AdoWorkItemOptionDto | null) => {
      setError(null);
      setLoading(true);

      const pbiTitle = selectedPbi?.title ?? `Historia #${values.pbiId}`;
      const payload = mapTimeLogFormToPayload(values, pbiTitle);

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

        clearTaskFields(form, getDefaultTaskState, getDefaultWorkingDate);
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
    [appendHistory, form, getDefaultTaskState, getDefaultWorkingDate],
  );

  return { error, loading, submit };
}
