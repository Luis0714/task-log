"use client";

import { useCallback, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { useCreateTask } from "@/hooks/time-log/use-create-task";
import { useTimeLogCatalog } from "@/hooks/time-log/use-time-log-catalog";
import { useTimeLogWizard } from "@/hooks/time-log/use-time-log-wizard";
import {
  createTimeLogFormDefaults,
  timeLogFormSchema,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";

type UseTimeLogFormOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  defaultProject?: string | null;
  adoExecutionReady: boolean;
};

export function useTimeLogForm({
  appendHistory,
  defaultProject = null,
  adoExecutionReady,
}: UseTimeLogFormOptions) {
  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: createTimeLogFormDefaults(defaultProject ?? ""),
    mode: "onTouched",
  });

  const wizard = useTimeLogWizard(form);
  const defaultTaskStateRef = useRef("");

  const createTask = useCreateTask({
    form,
    appendHistory,
    setStep: wizard.setStep,
    getDefaultTaskState: useCallback(
      () => defaultTaskStateRef.current || form.getValues("taskState"),
      [form],
    ),
  });

  const catalog = useTimeLogCatalog({
    form,
    adoExecutionReady,
    submitting: createTask.loading,
  });

  useEffect(() => {
    if (catalog.defaultCompletedTaskState) {
      defaultTaskStateRef.current = catalog.defaultCompletedTaskState;
    }
  }, [catalog.defaultCompletedTaskState]);

  const prepareSubmit = form.handleSubmit((values) => {
    createTask.preparePreview(values, catalog.selectedPbi);
  });

  const goToStep2 = () => {
    createTask.dismissPreview();
    wizard.goToStep2();
  };

  const goToStep1 = () => {
    createTask.dismissPreview();
    wizard.goToStep1();
  };

  return {
    form,
    catalog,
    step: wizard.step,
    preview: createTask.preview,
    error: createTask.error,
    loadingExecute: createTask.loading,
    goToStep1,
    goToStep2,
    prepareSubmit,
    execute: createTask.execute,
    dismissPreview: createTask.dismissPreview,
  };
}

export type { TimeLogStep } from "@/lib/time-log/catalog-types";
