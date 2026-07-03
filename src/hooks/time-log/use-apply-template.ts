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
    (values: Partial<AppliedFields>, opts: { shouldValidate: boolean }) => {
      const setOpts = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: opts.shouldValidate,
      };
      if (values.taskTitle !== undefined) {
        form.setValue("taskTitle", values.taskTitle, setOpts);
      }
      if (values.description !== undefined) {
        form.setValue("description", values.description, setOpts);
      }
      if (values.activity !== undefined) {
        form.setValue("activity", values.activity, setOpts);
      }
      if (values.hours !== undefined) {
        form.setValue("hours", values.hours, setOpts);
      }
      if (opts.shouldValidate) {
        form.trigger(["taskTitle", "description", "activity", "hours"]);
      }
    },
    [form],
  );

  const apply = useCallback(
    (template: TimeLogTemplateDto) => {
      writeValues(applyTemplateToRow(template, activities), { shouldValidate: true });
    },
    [activities, writeValues],
  );

  // Al limpiar (manual o por guardado exitoso) NO re-validamos: el
  // formulario queda intencionalmente vacío y listo para una nueva
  // tarea. Si re-validáramos, los campos requeridos vacíos volverían a
  // mostrar los mensajes rojos de "campo requerido".
  const clear = useCallback(() => {
    writeValues(
      { taskTitle: "", description: "", activity: "", hours: "" },
      { shouldValidate: false },
    );
  }, [writeValues]);

  return { apply, clear };
}
