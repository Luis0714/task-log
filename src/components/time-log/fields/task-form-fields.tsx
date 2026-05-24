import type { UseFormReturn } from "react-hook-form";

import { FormSelectField } from "@/components/time-log/fields/form-select-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import { TASK_ACTIVITY_OPTIONS, TASK_STATE_OPTIONS } from "@/lib/time-log/task-constants";

type TaskFormFieldsProps = {
  form: UseFormReturn<TimeLogFormValues>;
  disabled?: boolean;
};

export function TaskFormFields({ form, disabled = false }: TaskFormFieldsProps) {
  return (
  <>
    <FormField
      control={form.control}
      name="taskTitle"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título de la tarea</FormLabel>
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
            <FormLabel>Horas (Completed Work)</FormLabel>
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
            <FormLabel>Fecha de trabajo</FormLabel>
            <FormControl>
              <Input type="date" disabled={disabled} {...field} />
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
        label="Activity"
        placeholder="Selecciona actividad"
        disabled={disabled}
        options={TASK_ACTIVITY_OPTIONS.map((activity) => ({
          value: activity,
          label: activity,
        }))}
      />

      <FormSelectField
        control={form.control}
        name="taskState"
        label="Estado"
        placeholder="Estado de la tarea"
        disabled={disabled}
        options={TASK_STATE_OPTIONS.map((state) => ({
          value: state,
          label: state,
        }))}
      />
    </div>

    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Detalle opcional de lo realizado"
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
  </>
  );
}
