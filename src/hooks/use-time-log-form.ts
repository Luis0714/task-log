"use client";

import { useCallback, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { useCreateTask } from "@/hooks/time-log/use-create-task";
import { useTimeLogCatalog } from "@/hooks/time-log/use-time-log-catalog";
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import { resolveWorkingDateForSprint } from "@/hooks/time-log/use-sprint-working-date";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { appToast } from "@/lib/toast";
import {
  createTimeLogFormDefaults,
  timeLogFormSchema,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";
import { computeCanSubmit } from "@/lib/forms/can-submit";

type UseTimeLogFormOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  defaultProject?: string | null;
  adoExecutionReady: boolean;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
  isTaskCreationMode: boolean;
  initialWorkItemFilters?: Partial<WorkItemFilters>;
};

export function useTimeLogForm({
  appendHistory,
  defaultProject = null,
  adoExecutionReady,
  serverBaseline,
  pbisSnapshot,
  isTaskCreationMode,
  initialWorkItemFilters,
}: UseTimeLogFormOptions) {
  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: createTimeLogFormDefaults(
      defaultProject ?? "",
      serverBaseline.catalog,
    ),
    mode: "onTouched",
  });

  const { project: catalogProject, team: catalogTeam, sprintPath: catalogSprintPath } =
    serverBaseline.catalog;

  useEffect(() => {
    if (catalogProject && catalogProject !== form.getValues("project")) {
      form.setValue("project", catalogProject, { shouldValidate: true });
    }
    if (catalogTeam !== form.getValues("team")) {
      form.setValue("team", catalogTeam, { shouldValidate: true });
    }
    if (catalogSprintPath !== form.getValues("sprintPath")) {
      form.setValue("sprintPath", catalogSprintPath, { shouldValidate: true });
    }
  }, [catalogProject, catalogSprintPath, catalogTeam, form]);

  const defaultTaskStateRef = useRef("");
  const defaultCompletedTaskStateRef = useRef<string | null>(null);
  const sprintsRef = useRef<AdoSprintDto[]>([]);

  const createTask = useCreateTask({
    form,
    appendHistory,
    isTaskCreationMode,
    getDefaultTaskState: useCallback(
      () => defaultTaskStateRef.current || form.getValues("taskState"),
      [form],
    ),
    getDefaultCompletedTaskState: useCallback(
      () => defaultCompletedTaskStateRef.current ?? "",
      [],
    ),
    getDefaultWorkingDate: useCallback(
      () => resolveWorkingDateForSprint(sprintsRef.current, form.getValues("sprintPath")),
      [form],
    ),
  });

  const catalog = useTimeLogCatalog({
    form,
    adoExecutionReady,
    submitting: createTask.loading,
    serverBaseline,
    pbisSnapshot,
    isTaskCreationMode,
    initialWorkItemFilters,
  });

  sprintsRef.current = catalog.sprints;

  useEffect(() => {
    if (catalog.defaultOpenTaskState) {
      defaultTaskStateRef.current = catalog.defaultOpenTaskState;
    }
    if (catalog.defaultCompletedTaskState) {
      defaultCompletedTaskStateRef.current = catalog.defaultCompletedTaskState;
    }
  }, [catalog.defaultOpenTaskState, catalog.defaultCompletedTaskState]);

  const submit = form.handleSubmit((values) => {
    if (!adoExecutionReady) {
      appToast.error("Sin acceso a Azure DevOps.", {
        description: "Conecta tu cuenta o configura el PAT en el servidor.",
      });
      return;
    }
    void createTask.submit(values, catalog.selectedPbi);
  });

  const { isValid, isSubmitting } = form.formState;

  const canSubmit = computeCanSubmit({
    isValid,
    isSubmitting,
    externalReady: adoExecutionReady,
  });

  return {
    form,
    catalog,
    error: createTask.error,
    loadingExecute: createTask.loading,
    canSubmit,
    submit,
    lastSubmitted: createTask.lastSubmitted,
    clearLastSubmitted: createTask.clearLastSubmitted,
  };
}
