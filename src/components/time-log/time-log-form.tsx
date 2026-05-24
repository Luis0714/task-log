"use client";

import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";

import { TimeLogContextStep } from "@/components/time-log/time-log-context-step";
import { TimeLogStepIndicator } from "@/components/time-log/time-log-step-indicator";
import { TimeLogTaskStep } from "@/components/time-log/time-log-task-step";
import { Form } from "@/components/ui/form";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogStep } from "@/hooks/use-time-log-form";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogFormProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  step: TimeLogStep;
  adoExecutionReady: boolean;
  loading?: boolean;
  onContinue: () => void;
  onBack: () => void;
  onSubmit: () => void;
};

export function TimeLogForm({
  form,
  catalog,
  step,
  adoExecutionReady,
  loading = false,
  onContinue,
  onBack,
  onSubmit,
}: TimeLogFormProps) {
  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === 2) onSubmit();
        }}
      >
        <TimeLogStepIndicator step={step} />

        {step === 1 ? (
          <TimeLogContextStep form={form} catalog={catalog} onContinue={onContinue} />
        ) : (
          <TimeLogTaskStep
            form={form}
            catalog={catalog}
            adoExecutionReady={adoExecutionReady}
            loading={loading}
            onBack={onBack}
            onSubmit={onSubmit}
          />
        )}
      </form>
    </Form>
  );
}

export function TimeLogCopilotLink() {
  return (
    <p className="text-muted-foreground text-sm">
      ¿Prefieres lenguaje natural?{" "}
      <Link href="/copilot" className="text-primary font-medium hover:underline">
        Usa el Copiloto IA
      </Link>
    </p>
  );
}
