"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReviewTimesColumnHint({
  label,
  hint,
}: Readonly<{ label: string; hint: string }>) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5 py-0.5">
      <span className="font-medium">{label}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="text-muted-foreground block max-w-40 cursor-default truncate text-left text-[11px] font-normal" />
          }
        >
          {hint}
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-left">{hint}</TooltipContent>
      </Tooltip>
    </span>
  );
}
