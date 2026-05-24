"use client";

import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { applyZodIssuesToForm } from "@/lib/time-log/apply-zod-form-errors";
import type { TimeLogStep } from "@/lib/time-log/catalog-types";
import {
  timeLogContextStepSchema,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";

export function useTimeLogWizard(form: UseFormReturn<TimeLogFormValues>) {
  const [step, setStep] = useState<TimeLogStep>(1);

  const goToStep2 = useCallback(() => {
    const parsed = timeLogContextStepSchema.safeParse(form.getValues());
    if (!parsed.success) {
      applyZodIssuesToForm(form, parsed.error.issues);
      return false;
    }
    setStep(2);
    return true;
  }, [form]);

  const goToStep1 = useCallback(() => {
    setStep(1);
  }, []);

  return { step, setStep, goToStep1, goToStep2 };
}
