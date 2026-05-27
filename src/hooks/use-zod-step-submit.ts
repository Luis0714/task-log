"use client";

import { useMemo } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { computeCanSubmit } from "@/lib/forms/can-submit";

type UseZodStepSubmitOptions<TFieldValues extends Record<string, unknown>> = {
  form: UseFormReturn<TFieldValues>;
  schema: z.ZodType;
  fields: readonly FieldPath<TFieldValues>[];
  requireDirty?: boolean;
  externalReady?: boolean;
  isSubmitting?: boolean;
};

function buildFieldSnapshot<TFieldValues extends Record<string, unknown>>(
  fields: readonly FieldPath<TFieldValues>[],
  watched: unknown,
): Record<string, unknown> {
  const values = Array.isArray(watched) ? watched : [watched];
  return Object.fromEntries(fields.map((field, index) => [String(field), values[index]]));
}

export function useZodStepSubmit<TFieldValues extends Record<string, unknown>>({
  form,
  schema,
  fields,
  requireDirty = false,
  externalReady = true,
  isSubmitting = false,
}: UseZodStepSubmitOptions<TFieldValues>) {
  const watched = form.watch([...fields]);
  const { isDirty } = form.formState;

  const canSubmit = useMemo(() => {
    const snapshot = buildFieldSnapshot(fields, watched);
    const isValid = schema.safeParse(snapshot).success;
    return computeCanSubmit({
      isValid,
      isDirty,
      requireDirty,
      externalReady,
      isSubmitting,
    });
  }, [watched, isDirty, fields, schema, requireDirty, externalReady, isSubmitting]);

  return { canSubmit };
}
