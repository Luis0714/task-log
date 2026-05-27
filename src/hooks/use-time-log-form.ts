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
import { appToast } from "@/lib/toast";
import {
  createTimeLogFormDefaults,
  timeLogFormSchema,
} from "@/lib/schemas/time-log";

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
    mode: "onSubmit",
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

  const submit = form.handleSubmit((values) => {
    if (!adoExecutionReady) {
      appToast.error("Sin acceso a Azure DevOps.", {
        description: "Conecta tu cuenta o configura el PAT en el servidor.",
      });
      return;
    }
    void createTask.submit(values, catalog.selectedPbi);
  });

  return {
    form,
    catalog,
    error: createTask.error,
    loadingExecute: createTask.loading,
    submit,
  };
}
