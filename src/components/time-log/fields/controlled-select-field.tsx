import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectEmptyMessage } from "@/components/ui/select-empty-message";
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
  loading?: boolean;
  error?: string | null;
  triggerClassName?: string;
  displayValue?: ReactNode;
  triggerTitle?: string;
  itemTextWrap?: boolean;
  contentClassName?: string;
  alignItemWithTrigger?: boolean;
  emptyMessage?: ReactNode;
  onValueChange: (value: string) => void;
};

export function ControlledSelectField({
  label,
  required = false,
  value,
  placeholder,
  options,
  disabled,
  loading = false,
  error,
  triggerClassName,
  displayValue,
  triggerTitle,
  itemTextWrap = false,
  contentClassName,
  emptyMessage,
  alignItemWithTrigger = false,
  onValueChange,
}: ControlledSelectFieldProps) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-1.5">
      {label ? <Label required={required}>{label}</Label> : null}
      <Select
        value={value || null}
        onValueChange={(next) => {
          if (!next) return;
          onValueChange(next);
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className={cn("w-full min-w-0", triggerClassName)} title={triggerTitle}>
          <SelectValue placeholder={placeholder}>
            {displayValue ?? (value ? value : undefined)}
          </SelectValue>
          {loading ? (
            <Loader2
              className="text-muted-foreground ml-auto size-3.5 shrink-0 animate-spin"
              aria-hidden
            />
          ) : null}
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={alignItemWithTrigger}
          className={contentClassName}
        >
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem
                key={option.key ?? option.value}
                value={option.value}
                textWrap={itemTextWrap}
                title={typeof option.label === "string" ? option.label : option.value}
              >
                {option.label}
              </SelectItem>
            ))
          ) : emptyMessage ? (
            <SelectEmptyMessage>{emptyMessage}</SelectEmptyMessage>
          ) : null}
        </SelectContent>
      </Select>
      <FormInlineError message={error} />
    </div>
  );
}
