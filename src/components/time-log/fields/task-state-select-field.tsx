"use client";

import type { UseFormReturn } from "react-hook-form";

import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TaskStateSelectFieldProps = {
  form: UseFormReturn<TimeLogFormValues>;
  taskStates: AdoTaskStateDto[];
  taskStatesLoading?: boolean;
  taskStatesError?: string | null;
  disabled?: boolean;
};

export function TaskStateSelectField({
  form,
  taskStates,
  taskStatesLoading = false,
  taskStatesError = null,
  disabled = false,
}: TaskStateSelectFieldProps) {
  const taskState = form.watch("taskState");
  const autoMarkAsDone = form.watch("autoMarkAsDone");
  const stateOptions = taskStates.map((state) => ({
    value: state.name,
    label: <WorkItemStateLabel state={state.name} />,
  }));
  const statesReady = !taskStatesLoading && taskStates.length > 0;

  return (
    <div className="space-y-1">
      <FormSelectField
        control={form.control}
        name="taskState"
        label="Estado inicial"
        required={!autoMarkAsDone}
        placeholder={
          taskStatesLoading
            ? "Cargando estados..."
            : statesReady
              ? "Estado de la tarea"
              : "Estados no disponibles"
        }
        disabled={disabled || autoMarkAsDone || taskStatesLoading || !statesReady}
        options={stateOptions}
        displayValue={taskState ? <WorkItemStateLabel state={taskState} /> : undefined}
      />
      <FormInlineError message={taskStatesError} />
    </div>
  );
}
