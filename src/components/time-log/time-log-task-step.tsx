"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { TaskFormFields } from "@/components/time-log/fields/task-form-fields";
import { PbiSummaryCard } from "@/components/time-log/pbi-summary-card";
import { Button } from "@/components/ui/button";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogTaskStepProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  adoExecutionReady: boolean;
  loading?: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function TimeLogTaskStep({
  form,
  catalog,
  adoExecutionReady,
  loading = false,
  onBack,
  onSubmit,
}: TimeLogTaskStepProps) {
  const taskStatesReady =
    !catalog.taskStatesLoading && catalog.taskStates.length > 0 && !catalog.taskStatesError;

  return (
    <div className="flex flex-col gap-4">
      {catalog.selectedPbi ? <PbiSummaryCard pbi={catalog.selectedPbi} /> : null}

      <TaskFormFields
        form={form}
        taskStates={catalog.taskStates}
        taskStatesLoading={catalog.taskStatesLoading}
        taskStatesError={catalog.taskStatesError}
        disabled={loading}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full sm:w-auto"
          disabled={loading}
          onClick={onBack}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al contexto
        </Button>
        <Button
          type="button"
          disabled={loading || !adoExecutionReady || !taskStatesReady}
          className="min-h-10 w-full sm:w-auto"
          onClick={onSubmit}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Revisar y crear tarea
        </Button>
      </div>
    </div>
  );
}
