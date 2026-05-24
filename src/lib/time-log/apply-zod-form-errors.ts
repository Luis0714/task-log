import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ZodError } from "zod";

export function applyZodIssuesToForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  issues: ZodError["issues"],
) {
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      form.setError(field as Path<TFieldValues>, { message: issue.message });
    }
  }
}
