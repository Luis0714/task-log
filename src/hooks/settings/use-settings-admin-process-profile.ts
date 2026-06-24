"use client";

import { useCallback, useState } from "react";

import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { TaskDateFieldOption } from "@/lib/settings/task-date-field-options";
import { appToast } from "@/lib/toast/app-toast";

type UseSettingsAdminProcessProfileOptions = {
  project: string;
  initialProfile: AdoProcessProfile;
  initialOptions: TaskDateFieldOption[];
};

type ApiProfileResponse = {
  profile: AdoProcessProfile;
  taskDateFieldOptions?: TaskDateFieldOption[];
};

export function useSettingsAdminProcessProfile({
  project,
  initialProfile,
  initialOptions,
}: UseSettingsAdminProcessProfileOptions) {
  const [profile, setProfile] = useState(initialProfile);
  const [options, setOptions] = useState(initialOptions);

  const [workingDateField, setWorkingDateField] = useState(profile.workingDateField);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [completedWorkField, setCompletedWorkField] = useState<string>(profile.completedWorkField ?? "");
  const [originalEstimateField, setOriginalEstimateField] = useState<string>(profile.originalEstimateField ?? "");
  const [remainingWorkField, setRemainingWorkField] = useState<string>(profile.remainingWorkField ?? "");
  const [activityField, setActivityField] = useState<string>(profile.activityField ?? "");
  const [taskWorkItemType, setTaskWorkItemType] = useState(profile.taskWorkItemType);
  const [bugWorkItemType, setBugWorkItemType] = useState(profile.bugWorkItemType);
  const [backlogItemType, setBacklogItemType] = useState(profile.backlogItemType);
  const [taskTodoState, setTaskTodoState] = useState(profile.taskTodoState);
  const [taskDoneState, setTaskDoneState] = useState(profile.taskDoneState);

  const [busy, setBusy] = useState<"save" | "rediscover" | null>(null);

  const syncFromProfile = useCallback(
    (next: AdoProcessProfile, nextOptions?: TaskDateFieldOption[]) => {
      setProfile(next);
      setWorkingDateField(next.workingDateField);
      setTimezone(next.timezone);
      setCompletedWorkField(next.completedWorkField ?? "");
      setOriginalEstimateField(next.originalEstimateField ?? "");
      setRemainingWorkField(next.remainingWorkField ?? "");
      setActivityField(next.activityField ?? "");
      setTaskWorkItemType(next.taskWorkItemType);
      setBugWorkItemType(next.bugWorkItemType);
      setBacklogItemType(next.backlogItemType);
      setTaskTodoState(next.taskTodoState);
      setTaskDoneState(next.taskDoneState);
      if (nextOptions) setOptions(nextOptions);
    },
    [],
  );

  const save = useCallback(async () => {
    setBusy("save");
    try {
      const res = await fetch("/api/settings/process-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          workingDateField,
          timezone,
          completedWorkField: completedWorkField.trim() || null,
          originalEstimateField: originalEstimateField.trim() || null,
          remainingWorkField: remainingWorkField.trim() || null,
          activityField: activityField.trim() || null,
          taskWorkItemType,
          bugWorkItemType,
          backlogItemType,
          taskTodoState,
          taskDoneState,
        }),
      });
      const data = (await res.json()) as ApiProfileResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar.");
      }
      syncFromProfile(data.profile);
      appToast.success("Configuración guardada para todos los usuarios del proyecto.");
    } catch (cause) {
      appToast.fromError(cause, "No se pudo guardar la configuración.");
    } finally {
      setBusy(null);
    }
  }, [
    project,
    syncFromProfile,
    workingDateField,
    timezone,
    completedWorkField,
    originalEstimateField,
    remainingWorkField,
    activityField,
    taskWorkItemType,
    bugWorkItemType,
    backlogItemType,
    taskTodoState,
    taskDoneState,
  ]);

  const rediscover = useCallback(async () => {
    setBusy("rediscover");
    try {
      const res = await fetch("/api/settings/process-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await res.json()) as ApiProfileResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo actualizar.");
      }
      syncFromProfile(data.profile, data.taskDateFieldOptions);
      appToast.success("Configuración re-detectada desde Azure DevOps.");
    } catch (cause) {
      appToast.fromError(cause, "No se pudo actualizar desde Azure DevOps.");
    } finally {
      setBusy(null);
    }
  }, [project, syncFromProfile]);

  const isDirty =
    workingDateField !== profile.workingDateField ||
    timezone !== profile.timezone ||
    (completedWorkField.trim() || null) !== profile.completedWorkField ||
    (originalEstimateField.trim() || null) !== profile.originalEstimateField ||
    (remainingWorkField.trim() || null) !== profile.remainingWorkField ||
    (activityField.trim() || null) !== profile.activityField ||
    taskWorkItemType !== profile.taskWorkItemType ||
    bugWorkItemType !== profile.bugWorkItemType ||
    backlogItemType !== profile.backlogItemType ||
    taskTodoState !== profile.taskTodoState ||
    taskDoneState !== profile.taskDoneState;

  return {
    profile,
    options,
    workingDateField,
    setWorkingDateField,
    timezone,
    setTimezone,
    completedWorkField,
    setCompletedWorkField,
    originalEstimateField,
    setOriginalEstimateField,
    remainingWorkField,
    setRemainingWorkField,
    activityField,
    setActivityField,
    taskWorkItemType,
    setTaskWorkItemType,
    bugWorkItemType,
    setBugWorkItemType,
    backlogItemType,
    setBacklogItemType,
    taskTodoState,
    setTaskTodoState,
    taskDoneState,
    setTaskDoneState,
    busy,
    isDirty,
    save,
    rediscover,
  };
}
