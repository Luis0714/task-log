import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import type { FormSelectOption } from "@/components/time-log/fields/controlled-select-field";
export { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
export { FormInlineError } from "@/components/time-log/fields/form-inline-error";
export type {
  ControlledSelectFieldProps,
  FormSelectOption,
} from "@/components/time-log/fields/controlled-select-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  required?: boolean;
  placeholder: string;
  options: FormSelectOption[];
  disabled?: boolean;
  error?: string | null;
  triggerClassName?: string;
  displayValue?: ReactNode;
  onValueChange?: (value: string) => void;
};

export function FormSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  placeholder,
  options,
  disabled,
  error,
  triggerClassName,
  displayValue,
  onValueChange,
}: FormSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel required={required}>{label}</FormLabel>
          <Select
            value={field.value || null}
            onValueChange={(value) => {
              if (!value) return;
              field.onChange(value);
              onValueChange?.(value);
            }}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={cn("w-full", triggerClassName)}>
                <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.key ?? option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormInlineError message={error} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
