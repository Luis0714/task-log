"use client";

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import { applyTemplateToRow } from "@/lib/time-log/apply-template-to-row";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type AppliedFields = {
  taskTitle: string;
  description: string;
  activity: string;
  hours: string;
};

export function useApplyTemplate(
  form: UseFormReturn<TimeLogFormValues>,
  activities: readonly string[],
) {
  const writeValues = useCallback(
    (values: Partial<AppliedFields>) => {
      if (values.taskTitle !== undefined) {
        form.setValue("taskTitle", values.taskTitle, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (values.description !== undefined) {
        form.setValue("description", values.description, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (values.activity !== undefined) {
        form.setValue("activity", values.activity, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (values.hours !== undefined) {
        form.setValue("hours", values.hours, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      form.trigger(["taskTitle", "description", "activity", "hours"]);
    },
    [form],
  );

  const apply = useCallback(
    (template: TimeLogTemplateDto) => {
      writeValues(applyTemplateToRow(template, activities));
    },
    [activities, writeValues],
  );

  const clear = useCallback(() => {
    writeValues({ taskTitle: "", description: "", activity: "", hours: "" });
  }, [writeValues]);

  return { apply, clear };
}
