"use client";

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import { listSprintWorkingDays } from "@/lib/dashboard/sprint-days";
import { resolveDefaultWorkingDate } from "@/lib/time-log/working-date-default";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type UseSprintWorkingDateOptions = {
  form: UseFormReturn<TimeLogFormValues>;
  sprintPath: string;
  sprints: AdoSprintDto[];
  sprintsLoading: boolean;
};

/** Sincroniza workingDate con el día laborable actual del sprint o el último pasado. */
export function useSprintWorkingDate({
  form,
  sprintPath,
  sprints,
  sprintsLoading,
}: UseSprintWorkingDateOptions): void {
  const previousSprintPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sprintPath || sprintsLoading) return;

    const sprint = sprints.find((item) => item.path === sprintPath);
    if (!sprint) return;

    const workingDays = listSprintWorkingDays(sprint.startDate, sprint.finishDate);
    const defaultDate = resolveDefaultWorkingDate(sprint.startDate, sprint.finishDate);
    const currentDate = form.getValues("workingDate");
    const sprintChanged = previousSprintPathRef.current !== sprintPath;
    previousSprintPathRef.current = sprintPath;

    const allowedDays = new Set(workingDays.map((day) => day.value));
    const currentIsInSprint = allowedDays.has(currentDate);

    if (sprintChanged || !currentIsInSprint) {
      if (currentDate !== defaultDate) {
        form.setValue("workingDate", defaultDate, { shouldValidate: true });
      }
      return;
    }

    if (!currentDate && defaultDate) {
      form.setValue("workingDate", defaultDate, { shouldValidate: true });
    }
  }, [form, sprintPath, sprints, sprintsLoading]);
}

export function resolveWorkingDateForSprint(
  sprints: AdoSprintDto[],
  sprintPath: string,
): string {
  const sprint = sprints.find((item) => item.path === sprintPath);
  return resolveDefaultWorkingDate(sprint?.startDate, sprint?.finishDate);
}
