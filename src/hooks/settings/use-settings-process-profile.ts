"use client";

import { useCallback, useState } from "react";

import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import {
  rediscoverProcessProfile,
  saveProcessProfile,
} from "@/lib/settings/process-profile-client";
import type { TaskDateFieldOption } from "@/lib/settings/task-date-field-options";
import { appToast } from "@/lib/toast/app-toast";

type UseSettingsProcessProfileOptions = {
  project: string;
  initialProfile: AdoProcessProfile;
  initialOptions: TaskDateFieldOption[];
};

type TestResponse = {
  ok: boolean;
  message: string;
};

export function useSettingsProcessProfile({
  project,
  initialProfile,
  initialOptions,
}: UseSettingsProcessProfileOptions) {
  const [profile, setProfile] = useState(initialProfile);
  const [options, setOptions] = useState(initialOptions);
  const [workingDateField, setWorkingDateField] = useState(profile.workingDateField);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [busy, setBusy] = useState<"save" | "rediscover" | "test" | null>(null);

  const syncFromProfile = useCallback((next: AdoProcessProfile, nextOptions?: TaskDateFieldOption[]) => {
    setProfile(next);
    setWorkingDateField(next.workingDateField);
    setTimezone(next.timezone);
    if (nextOptions) setOptions(nextOptions);
  }, []);

  const save = useCallback(async () => {
    setBusy("save");
    try {
      const data = await saveProcessProfile({ project, workingDateField, timezone });
      syncFromProfile(data.profile);
      appToast.success("Preferencias guardadas.");
    } catch (cause) {
      appToast.fromError(cause, "No se pudo guardar la configuración.");
    } finally {
      setBusy(null);
    }
  }, [project, syncFromProfile, timezone, workingDateField]);

  const rediscover = useCallback(async () => {
    setBusy("rediscover");
    try {
      const data = await rediscoverProcessProfile(project);
      syncFromProfile(data.profile, data.taskDateFieldOptions);
      appToast.success("Configuración actualizada desde Azure DevOps.");
    } catch (cause) {
      appToast.fromError(cause, "No se pudo actualizar desde Azure DevOps.");
    } finally {
      setBusy(null);
    }
  }, [project, syncFromProfile]);

  const testConfiguration = useCallback(async () => {
    setBusy("test");
    try {
      const res = await fetch("/api/settings/process-profile/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, workingDateField, timezone }),
      });
      const data = (await res.json()) as TestResponse & { error?: string };
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }
      if (data.ok) {
        appToast.success(data.message);
      } else {
        appToast.warning(data.message);
      }
    } catch (cause) {
      appToast.fromError(cause, "No se pudo probar la configuración.");
    } finally {
      setBusy(null);
    }
  }, [project, timezone, workingDateField]);

  const isDirty =
    workingDateField !== profile.workingDateField || timezone !== profile.timezone;

  return {
    profile,
    options,
    workingDateField,
    setWorkingDateField,
    timezone,
    setTimezone,
    busy,
    isDirty,
    save,
    rediscover,
    testConfiguration,
  };
}
