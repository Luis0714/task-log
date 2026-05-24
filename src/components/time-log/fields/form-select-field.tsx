import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

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

export function FormInlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

export type FormSelectOption = {
  value: string;
  label: ReactNode;
  key?: string;
};

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
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
          <FormLabel>{label}</FormLabel>
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
