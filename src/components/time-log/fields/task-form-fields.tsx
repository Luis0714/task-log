"use client";

import type { UseFormReturn } from "react-hook-form";

import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { FormInlineError } from "@/components/time-log/fields/form-select-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import { TASK_ACTIVITY_LABELS, TASK_ACTIVITY_OPTIONS } from "@/lib/time-log/task-constants";

type TaskFormFieldsProps = {
  form: UseFormReturn<TimeLogFormValues>;
  taskStates: AdoTaskStateDto[];
  taskStatesLoading?: boolean;
  taskStatesError?: string | null;
  defaultCompletedTaskState?: string | null;
  disabled?: boolean;
};

export function TaskFormFields({
  form,
  taskStates,
  taskStatesLoading = false,
  taskStatesError = null,
  defaultCompletedTaskState = null,
  disabled = false,
}: TaskFormFieldsProps) {
  const taskState = form.watch("taskState");
  const autoMarkAsDone = form.watch("autoMarkAsDone");
  const stateOptions = taskStates.map((state) => ({
    value: state.name,
    label: <WorkItemStateLabel state={state.name} />,
  }));
  const statesReady = !taskStatesLoading && taskStates.length > 0;

  return (
    <>
      <FormField
        control={form.control}
        name="taskTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Título de la tarea</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej. Reunión equipo, desarrollo endpoint..."
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Horas (trabajo completado)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="1.5" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Fecha de trabajo</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          control={form.control}
          name="activity"
          label="Actividad"
          required
          placeholder="Selecciona actividad"
          disabled={disabled}
          options={TASK_ACTIVITY_OPTIONS.map((activity) => ({
            value: activity,
            label: TASK_ACTIVITY_LABELS[activity],
          }))}
        />

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
            displayValue={
              taskState ? <WorkItemStateLabel state={taskState} /> : undefined
            }
          />
          <FormInlineError message={taskStatesError} />
        </div>
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe lo realizado en esta tarea"
                rows={3}
                disabled={disabled}
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </>
  );
}
