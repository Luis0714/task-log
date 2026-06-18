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
  /** Muestra un spinner en lugar del valor/placeholder mientras se cargan datos dependientes. */
  loading?: boolean;
  error?: string | null;
  triggerClassName?: string;
  displayValue?: ReactNode;
  /** Texto completo en hover del trigger (p. ej. nombres largos de equipo). */
  triggerTitle?: string;
  /** Opciones multilínea en el listado (p. ej. equipos con nombres largos). */
  itemTextWrap?: boolean;
  contentClassName?: string;
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
  onValueChange,
}: ControlledSelectFieldProps) {
  return (
    <div className="min-w-0 w-full space-y-2">
      <Label required={required}>{label}</Label>
      <Select
        value={loading ? null : (value || null)}
        onValueChange={(next) => {
          if (!next) return;
          onValueChange(next);
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className={cn("w-full min-w-0", triggerClassName)} title={triggerTitle}>
          {loading ? (
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {placeholder}
            </span>
          ) : (
            <SelectValue placeholder={placeholder}>
              {displayValue ?? (value ? value : undefined)}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((option) => (
            <SelectItem
              key={option.key ?? option.value}
              value={option.value}
              textWrap={itemTextWrap}
              title={typeof option.label === "string" ? option.label : option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormInlineError message={error} />
    </div>
  );
}
