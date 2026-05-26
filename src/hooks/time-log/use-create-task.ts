"use client";

import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { createTaskInAdo } from "@/lib/time-log/create-task-client";
import { resetTaskStepFields } from "@/lib/time-log/form-selection";
import type { TimeLogStep } from "@/lib/time-log/catalog-types";
import {
  TIME_LOG_TASK_STEP_DEFAULTS,
  mapTimeLogFormToPayload,
  type CreateTaskPayload,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";
import { appToast } from "@/lib/toast";

type UseCreateTaskOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  appendHistory: (entry: CopilotHistoryEntry) => void;
  setStep: (step: TimeLogStep) => void;
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
  resetTaskStepFields(form);
}

export function useCreateTask({
  form,
  appendHistory,
  setStep,
  getDefaultTaskState,
  getDefaultWorkingDate,
}: UseCreateTaskOptions) {
  const [preview, setPreview] = useState<CreateTaskPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preparePreview = useCallback(
    (values: TimeLogFormValues, selectedPbi: AdoWorkItemOptionDto | null) => {
      setError(null);
      const pbiTitle = selectedPbi?.title ?? `Historia #${values.pbiId}`;
      setPreview(mapTimeLogFormToPayload(values, pbiTitle));
    },
    [],
  );

  const execute = useCallback(
    async (payload: CreateTaskPayload) => {
      setError(null);
      setLoading(true);

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
            summary: `Tarea en historia #${payload.pbiId} +${payload.hours}h (falló)`,
            ok: false,
          });
          return;
        }

        setPreview(null);
        clearTaskFields(form, getDefaultTaskState, getDefaultWorkingDate);
        setStep(2);
        appToast.success(`Tarea creada: #${result.taskId}`, {
          description: `${payload.title} · ${payload.hours}h · Historia #${payload.pbiId}`,
        });
        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary: `Tarea #${result.taskId} +${payload.hours}h · Historia #${payload.pbiId}`,
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
    [appendHistory, form, getDefaultTaskState, getDefaultWorkingDate, setStep],
  );

  const dismissPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return { preview, error, loading, preparePreview, execute, dismissPreview };
}
