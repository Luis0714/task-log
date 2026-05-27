"use client";

import type { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TaskAutoMarkAsDoneFieldProps = {
  form: UseFormReturn<TimeLogFormValues>;
  defaultCompletedTaskState?: string | null;
  disabled?: boolean;
};

export function TaskAutoMarkAsDoneField({
  form,
  defaultCompletedTaskState = null,
  disabled = false,
}: TaskAutoMarkAsDoneFieldProps) {
  const autoMarkAsDone = form.watch("autoMarkAsDone");

  return (
    <FormField
      control={form.control}
      name="autoMarkAsDone"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 rounded-lg border bg-muted/30 p-3">
          <FormControl>
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              disabled={disabled}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <div className="min-w-0 space-y-1 leading-none">
            <FormLabel className="cursor-pointer font-medium">
              Marcar como Done al crear
            </FormLabel>
            <p className="text-muted-foreground text-sm text-pretty">
              {autoMarkAsDone
                ? defaultCompletedTaskState
                  ? `La tarea pasará a «${defaultCompletedTaskState}» y contará de inmediato en las horas del día.`
                  : "La tarea pasará a Done y contará de inmediato en las horas del día."
                : "La tarea se creará en estado abierto; deberás cambiarla a Done manualmente para que sume en el dashboard."}
            </p>
          </div>
        </FormItem>
      )}
    />
  );
}
