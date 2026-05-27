"use client";

import { useCallback, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { useZodStepSubmit } from "@/hooks/use-zod-step-submit";
import { useCreateTask } from "@/hooks/time-log/use-create-task";
import { useTimeLogCatalog } from "@/hooks/time-log/use-time-log-catalog";
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import { resolveWorkingDateForSprint } from "@/hooks/time-log/use-sprint-working-date";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import {
  createTimeLogFormDefaults,
  timeLogFormSchema,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";

const TIME_LOG_FORM_FIELDS = [
  "project",
  "team",
  "sprintPath",
  "pbiId",
  "taskTitle",
  "hours",
  "description",
  "activity",
  "workingDate",
  "taskState",
] as const satisfies readonly (keyof TimeLogFormValues)[];

type UseTimeLogFormOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  defaultProject?: string | null;
  adoExecutionReady: boolean;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
};

export function useTimeLogForm({
  appendHistory,
  defaultProject = null,
  adoExecutionReady,
  serverBaseline,
  pbisSnapshot,
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
  const sprintsRef = useRef<AdoSprintDto[]>([]);

  const createTask = useCreateTask({
    form,
    appendHistory,
    getDefaultTaskState: useCallback(
      () => defaultTaskStateRef.current || form.getValues("taskState"),
      [form],
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
  });

  sprintsRef.current = catalog.sprints;

  useEffect(() => {
    if (catalog.defaultOpenTaskState) {
      defaultTaskStateRef.current = catalog.defaultOpenTaskState;
    }
  }, [catalog.defaultOpenTaskState]);

  const taskStatesReady =
    !catalog.taskStatesLoading && catalog.taskStates.length > 0 && !catalog.taskStatesError;

  const { canSubmit } = useZodStepSubmit({
    form,
    schema: timeLogFormSchema,
    fields: TIME_LOG_FORM_FIELDS,
    externalReady:
      adoExecutionReady &&
      taskStatesReady &&
      !catalog.catalogDisabled &&
      !catalog.pbisLoading,
    isSubmitting: createTask.loading,
  });

  const prepareSubmit = form.handleSubmit((values) => {
    createTask.preparePreview(values, catalog.selectedPbi);
  });

  return {
    form,
    catalog,
    canSubmit,
    preview: createTask.preview,
    error: createTask.error,
    loadingExecute: createTask.loading,
    prepareSubmit,
    execute: createTask.execute,
    dismissPreview: createTask.dismissPreview,
  };
}
