"use client";

import { ComboboxTrigger } from "@/components/ui/combobox";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LinkableWorkItemsTriggerProps = {
  id?: string;
  placeholder: string;
  disabled?: boolean;
};

export function LinkableWorkItemsTrigger({
  id,
  placeholder,
  disabled,
}: LinkableWorkItemsTriggerProps) {
  return (
    <ComboboxTrigger
      id={id}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "w-full justify-between font-normal",
      )}
    >
      <span className="text-muted-foreground truncate">{placeholder}</span>
    </ComboboxTrigger>
  );
}
