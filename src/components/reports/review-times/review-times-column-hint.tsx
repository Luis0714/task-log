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
    <span className="flex w-full min-w-0 flex-col items-start gap-1 py-0.5">
      <span className="leading-tight font-medium whitespace-normal">{label}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="text-muted-foreground block w-full min-w-0 cursor-default truncate text-left text-[11px] leading-tight font-normal" />
          }
        >
          {hint}
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-left">{hint}</TooltipContent>
      </Tooltip>
    </span>
  );
}
