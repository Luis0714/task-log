import { useEffect, useMemo, useState } from "react";

import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { computeDraftCanSave } from "@/lib/forms/can-submit";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { DEFAULT_WORKING_TIME, isValidWorkingTime } from "@/lib/date/ado-datetime";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { isDateKeyValid } from "@/lib/validation/date-key";

type SprintDateBounds = {
  min: string | undefined;
  max: string | undefined;
};

function buildSprintDateBounds(sprintWorkingDays: readonly SprintWorkingDay[]): SprintDateBounds {
  if (sprintWorkingDays.length === 0) {
    return { min: undefined, max: undefined };
  }

  return {
    min: sprintWorkingDays[0]?.value,
    max: sprintWorkingDays[sprintWorkingDays.length - 1]?.value,
  };
}

export function useTaskDetailDraftController({
  task,
  taskStates,
  statesLoading,
  project,
  sprintWorkingDays,
  saving,
}: {
  task: AdoWorkItemOptionDto | null;
  taskStates: readonly AdoTaskStateDto[];
  statesLoading: boolean;
  project: string | null;
  sprintWorkingDays: readonly SprintWorkingDay[];
  saving: boolean;
}) {
  const [draftState, setDraftState] = useState("");
  const [draftWorkingDate, setDraftWorkingDate] = useState("");
  const [draftWorkingTime, setDraftWorkingTime] = useState(DEFAULT_WORKING_TIME);

  const stateOptions = useMemo(() => taskStates.map((state) => state.name), [taskStates]);
  const statesReady = !statesLoading && stateOptions.length > 0;
  const sprintDateBounds = useMemo(
    () => buildSprintDateBounds(sprintWorkingDays),
    [sprintWorkingDays],
  );

  useEffect(() => {
    if (!task) return;

    setDraftState(task.state);
    setDraftWorkingDate(task.workingDate?.trim() || getDefaultWorkingDate());
    setDraftWorkingTime(task.workingTime?.trim() || DEFAULT_WORKING_TIME);
  }, [task?.id, task?.state, task?.workingDate, task?.workingTime]);

  const initialWorkingDate = task?.workingDate?.trim() ?? "";
  const initialWorkingTime = task?.workingTime?.trim() || DEFAULT_WORKING_TIME;
  const isStateDirty = Boolean(task && draftState !== task.state);
  const isDateDirty = Boolean(task && draftWorkingDate !== initialWorkingDate);
  const isTimeDirty = Boolean(task && draftWorkingTime !== initialWorkingTime);
  const isDirty = isStateDirty || isDateDirty || isTimeDirty;
  const canSave = computeDraftCanSave({
    isDirty,
    isValid: isDateKeyValid(draftWorkingDate) && isValidWorkingTime(draftWorkingTime),
    externalReady: statesReady && Boolean(project),
    isSubmitting: saving,
  });

  return {
    draftState,
    setDraftState,
    draftWorkingDate,
    setDraftWorkingDate,
    draftWorkingTime,
    setDraftWorkingTime,
    stateOptions,
    statesReady,
    sprintDateBounds,
    canSave,
  };
}
