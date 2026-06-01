"use client";

import type { UseFormReturn } from "react-hook-form";

import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import { TaskAutoMarkAsDoneField } from "@/components/time-log/fields/task-auto-mark-as-done-field";
import { TaskStateSelectField } from "@/components/time-log/fields/task-state-select-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePickerTime } from "@/components/ui/date-picker-time";
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
      </div>

      <FormField
        control={form.control}
        name="workingDate"
        render={({ field: dateField }) => (
          <FormField
            control={form.control}
            name="workingTime"
            render={({ field: timeField }) => (
              <FormItem>
                <FormLabel required>Fecha y hora de trabajo</FormLabel>
                <FormControl>
                  <DatePickerTime
                    dateValue={dateField.value}
                    timeValue={timeField.value}
                    onDateChange={dateField.onChange}
                    onTimeChange={timeField.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                {form.formState.errors.workingDate?.message ? (
                  <p className="text-destructive text-sm font-medium">
                    {form.formState.errors.workingDate.message}
                  </p>
                ) : null}
                {form.formState.errors.workingTime?.message ? (
                  <p className="text-destructive text-sm font-medium">
                    {form.formState.errors.workingTime.message}
                  </p>
                ) : null}
              </FormItem>
            )}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TaskStateSelectField
          form={form}
          taskStates={taskStates}
          taskStatesLoading={taskStatesLoading}
          taskStatesError={taskStatesError}
          disabled={disabled}
        />
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

      <TaskAutoMarkAsDoneField
        form={form}
        defaultCompletedTaskState={defaultCompletedTaskState}
        disabled={disabled}
      />
    </>
  );
}
