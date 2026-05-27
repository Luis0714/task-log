import type { ReactNode } from "react";

import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: ReactNode;
  key?: string;
};

export type ControlledSelectFieldProps = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: FormSelectOption[];
  disabled?: boolean;
  error?: string | null;
  triggerClassName?: string;
  displayValue?: ReactNode;
  onValueChange: (value: string) => void;
};

export function ControlledSelectField({
  label,
  required = false,
  value,
  placeholder,
  options,
  disabled,
  error,
  triggerClassName,
  displayValue,
  onValueChange,
}: ControlledSelectFieldProps) {
  return (
    <div className="min-w-0 w-full space-y-2">
      <Label required={required}>{label}</Label>
      <Select
        value={value || null}
        onValueChange={(next) => {
          if (!next) return;
          onValueChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.key ?? option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormInlineError message={error} />
    </div>
  );
}
