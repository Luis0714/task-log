"use client";

import { CheckCircle2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import { TaskAutoMarkAsDoneField } from "@/components/time-log/fields/task-auto-mark-as-done-field";
import { TaskStateSelectField } from "@/components/time-log/fields/task-state-select-field";
import { TemplateSelectField } from "@/components/time-log/fields/template-select-field";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
type TaskFormFieldsProps = {
  form: UseFormReturn<TimeLogFormValues>;
  taskStates: AdoTaskStateDto[];
  taskStatesLoading?: boolean;
  taskStatesError?: string | null;
  defaultCompletedTaskState?: string | null;
  disabled?: boolean;
  activities: readonly string[];
  /**
   * `true` cuando el usuario viene del flujo "Nueva tarea" (?create=1) y
   * debe poder configurar el estado inicial. En modo time-log puro
   * ocultamos los campos relacionados con el estado y mostramos un aviso.
   */
  isTaskCreationMode: boolean;
};

export function TaskFormFields({
  form,
  taskStates,
  taskStatesLoading = false,
  taskStatesError = null,
  defaultCompletedTaskState = null,
  disabled = false,
  activities,
  isTaskCreationMode,
}: TaskFormFieldsProps) {
  return (
    <>
      <TemplateSelectField form={form} activities={activities} />

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
          options={activities.map((activity) => ({
            value: activity,
            label: activity,
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

      {isTaskCreationMode ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TaskStateSelectField
            form={form}
            taskStates={taskStates}
            taskStatesLoading={taskStatesLoading}
            taskStatesError={taskStatesError}
            disabled={disabled}
          />
        </div>
      ) : null}

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

      {isTaskCreationMode ? (
        <TaskAutoMarkAsDoneField
          form={form}
          defaultCompletedTaskState={defaultCompletedTaskState}
          disabled={disabled}
        />
      ) : (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertTitle>La tarea se creará automáticamente como Done</AlertTitle>
          <AlertDescription>
            {defaultCompletedTaskState
              ? `Al registrar tiempo, la nueva tarea quedará en «${defaultCompletedTaskState}» y contará de inmediato en las horas del día. No es necesario seleccionar estado.`
              : "Al registrar tiempo, la nueva tarea quedará en Done y contará de inmediato en las horas del día. No es necesario seleccionar estado."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}