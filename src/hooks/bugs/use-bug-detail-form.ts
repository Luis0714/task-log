"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatInitialCompletedWork,
  parseCompletedWorkInput,
} from "@/lib/bugs/completed-work-input";
import { updateBugInAdo } from "@/lib/bugs/update-bug-in-ado";
import { getSprintDateBounds, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { computeDraftCanSave } from "@/lib/forms/can-submit";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { isDateKeyValid } from "@/lib/validation/date-key";

export function isReopenedState(state: string): boolean {
  return state.trim().toLowerCase() === "reopened";
}

export type UseBugDetailFormOptions = {
  bug: AdoWorkItemOptionDto | null;
  bugStates: readonly AdoTaskStateDto[];
  statesLoading?: boolean;
  project: string | null;
  sprintWorkingDays?: readonly SprintWorkingDay[];
  onSaved?: () => void;
  onClose?: () => void;
};

export function useBugDetailForm({
  bug,
  bugStates,
  statesLoading = false,
  project,
  sprintWorkingDays = [],
  onSaved,
  onClose,
}: UseBugDetailFormOptions) {
  const [draftState, setDraftState] = useState("");
  const [draftWorkingDate, setDraftWorkingDate] = useState("");
  const [draftCompletedWork, setDraftCompletedWork] = useState("0");
  const [draftReopenedDate, setDraftReopenedDate] = useState("");
  const [draftNewParentId, setDraftNewParentId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const stateOptions = useMemo(() => bugStates.map((state) => state.name), [bugStates]);
  const statesReady = !statesLoading && stateOptions.length > 0;
  const sprintDateBounds = useMemo(
    () => getSprintDateBounds(sprintWorkingDays),
    [sprintWorkingDays],
  );

  useEffect(() => {
    if (!bug) return;
    setDraftState(bug.state);
    setDraftWorkingDate(bug.workingDate?.trim() || getDefaultWorkingDate());
    setDraftCompletedWork(formatInitialCompletedWork(bug.loggedHours));
    setDraftReopenedDate("");
    setDraftNewParentId(undefined);
  }, [bug?.id, bug?.state, bug?.workingDate, bug?.loggedHours]);

  const initialWorkingDate = bug?.workingDate?.trim() ?? "";
  const initialCompletedWork = bug?.loggedHours ?? 0;
  const parsedCompletedWork = parseCompletedWorkInput(draftCompletedWork);
  const reopening = isReopenedState(draftState);

  const isStateDirty = Boolean(bug && draftState !== bug.state);
  const isDateDirty = Boolean(bug && draftWorkingDate !== initialWorkingDate);
  const isHoursDirty = Boolean(
    bug && parsedCompletedWork !== null && parsedCompletedWork !== initialCompletedWork,
  );
  const isParentDirty = Boolean(bug && draftNewParentId !== undefined);
  const isDirty = isStateDirty || isDateDirty || isHoursDirty || isParentDirty;

  const isReopenedDateValid = !reopening || isDateKeyValid(draftReopenedDate);

  const canSave = computeDraftCanSave({
    isDirty,
    isValid:
      isDateKeyValid(draftWorkingDate) &&
      parsedCompletedWork !== null &&
      isReopenedDateValid,
    externalReady: statesReady && Boolean(project),
    isSubmitting: saving,
  });

  const save = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!bug || !project || !canSave || parsedCompletedWork === null) {
      return { ok: false, message: "Completa los campos obligatorios antes de guardar." };
    }

    setSaving(true);
    try {
      const result = await updateBugInAdo(bug.id, {
        project,
        state: draftState,
        workingDate: isDateDirty ? draftWorkingDate : undefined,
        completedWork: parsedCompletedWork,
        reopenedDate: reopening && draftReopenedDate ? draftReopenedDate : undefined,
        newParentId: draftNewParentId,
      });

      if (!result.ok) return result;

      onSaved?.();
      onClose?.();
      return { ok: true };
    } finally {
      setSaving(false);
    }
  }, [
    bug,
    project,
    canSave,
    parsedCompletedWork,
    draftState,
    draftWorkingDate,
    isDateDirty,
    draftReopenedDate,
    reopening,
    draftNewParentId,
    onSaved,
    onClose,
  ]);

  return {
    draftState,
    setDraftState,
    draftWorkingDate,
    setDraftWorkingDate,
    draftCompletedWork,
    setDraftCompletedWork,
    draftReopenedDate,
    setDraftReopenedDate,
    draftNewParentId,
    setDraftNewParentId,
    reopening,
    stateOptions,
    statesReady,
    statesLoading,
    sprintDateBounds,
    saving,
    canSave,
    save,
  };
}
