"use client";

import { Loader2, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { TaskFormFields } from "@/components/time-log/fields/task-form-fields";
import { PbiSelectField } from "@/components/time-log/fields/pbi-select-field";
import { TemplateSelectField } from "@/components/time-log/fields/template-select-field";
import { SaveAsTemplateDialog } from "@/components/time-log/save-as-template-dialog";
import { Button } from "@/components/ui/button";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import { useTaskMeta } from "@/hooks/use-task-meta";

export type TimeLogFormProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  loading?: boolean;
  canSubmit?: boolean;
  onSubmit: () => void;
  lastSubmitted?: {
    taskTitle: string;
    description: string;
    activity?: string;
    hours?: string;
  } | null;
};

export function TimeLogForm({
  form,
  catalog,
  loading = false,
  canSubmit = true,
  onSubmit,
  lastSubmitted = null,
}: Readonly<TimeLogFormProps>) {
  const { activities } = useTaskMeta();
  const canSaveTemplate =
    lastSubmitted !== null &&
    lastSubmitted.taskTitle.trim().length > 0 &&
    lastSubmitted.description.trim().length > 0;

  return (
    <form
      className="flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <TemplateSelectField form={form} activities={activities} />

      <PbiSelectField form={form} catalog={catalog} />

      <TaskFormFields
        form={form}
        taskStates={catalog.taskStates}
        taskStatesLoading={catalog.taskStatesLoading}
        taskStatesError={catalog.taskStatesError}
        defaultCompletedTaskState={catalog.defaultCompletedTaskState}
        activities={activities}
        disabled={loading}
        isTaskCreationMode={catalog.isTaskCreationMode}
      />

      <Button
        type="submit"
        disabled={loading || !canSubmit}
        className="min-h-10 w-full"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        Crear tarea
      </Button>
      {canSaveTemplate ? (
        <SaveAsTemplateDialog
          defaultTitle={lastSubmitted!.taskTitle}
          defaultDescription={lastSubmitted!.description}
          defaultActivity={lastSubmitted?.activity}
          defaultHours={lastSubmitted?.hours}
          activities={activities}
          disabled={loading}
        />
      ) : null}
    </form>
  );
}
export { TimeLogCopilotLink } from "@/components/time-log/time-log-copilot-link";
