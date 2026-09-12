"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELEASE_DEFINITION_PLACEHOLDER } from "@/lib/releases/copy";
import type { ReleaseDefinitionOption } from "@/lib/releases/types";
import { cn } from "@/lib/utils";

export type ReleaseDefinitionSelectProps = {
  value: number | null;
  options: readonly ReleaseDefinitionOption[];
  disabled?: boolean;
  onValueChange: (value: number) => void;
  className?: string;
};

export function ReleaseDefinitionSelect({
  value,
  options,
  disabled,
  onValueChange,
  className,
}: ReleaseDefinitionSelectProps) {
  const selected = options.find((option) => option.id === value);

  return (
    <Select
      value={value ? String(value) : null}
      onValueChange={(next) => {
        if (!next) return;
        onValueChange(Number(next));
      }}
      disabled={disabled || options.length === 0}
    >
      <SelectTrigger
        className={cn("h-9 min-w-0 sm:w-56", className)}
        title={selected?.name}
        aria-label={RELEASE_DEFINITION_PLACEHOLDER}
      >
        <SelectValue placeholder={RELEASE_DEFINITION_PLACEHOLDER}>
          {selected?.name ?? RELEASE_DEFINITION_PLACEHOLDER}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={String(option.id)} title={option.name}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
