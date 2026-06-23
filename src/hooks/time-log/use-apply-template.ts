"use client";

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export function useApplyTemplate(
  form: UseFormReturn<TimeLogFormValues>,
  activities: readonly string[],
) {
  const writeValues = useCallback(
    (
      values: Partial<{
        taskTitle: string;
        description: string;
        activity: string;
      }>,
    ) => {
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
      form.trigger(["taskTitle", "description", "activity"]);
    },
    [form],
  );

  const apply = useCallback(
    (template: TimeLogTemplateDto) => {
      const activity =
        template.defaultActivity && activities.includes(template.defaultActivity)
          ? template.defaultActivity
          : "";

      writeValues({
        taskTitle: template.defaultTitle,
        description: template.defaultDescription,
        activity,
      });
    },
    [activities, writeValues],
  );

  const clear = useCallback(() => {
    writeValues({ taskTitle: "", description: "", activity: "" });
  }, [writeValues]);

  return { apply, clear };
}

