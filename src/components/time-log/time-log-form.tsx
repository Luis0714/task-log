"use client";

import { Loader2, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { TaskFormFields } from "@/components/time-log/fields/task-form-fields";
import { PbiSelectField } from "@/components/time-log/fields/pbi-select-field";
import { Button } from "@/components/ui/button";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogFormProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  loading?: boolean;
  canSubmit?: boolean;
  onSubmit: () => void;
};

export function TimeLogForm({
  form,
  catalog,
  loading = false,
  canSubmit = true,
  onSubmit,
}: TimeLogFormProps) {
  return (
    <form
      className="flex min-w-0 flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <PbiSelectField form={form} catalog={catalog} />

      <TaskFormFields
        form={form}
        taskStates={catalog.taskStates}
        taskStatesLoading={catalog.taskStatesLoading}
        taskStatesError={catalog.taskStatesError}
        defaultCompletedTaskState={catalog.defaultCompletedTaskState}
        disabled={loading}
        isTaskCreationMode={catalog.isTaskCreationMode}
      />

      <Button type="submit" disabled={loading || !canSubmit} className="min-h-10 w-full sm:w-auto">
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        Crear tarea
      </Button>
    </form>
  );
}
export { TimeLogCopilotLink } from "@/components/time-log/time-log-copilot-link";
