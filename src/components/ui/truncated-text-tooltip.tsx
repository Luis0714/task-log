"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type TruncatedTextTooltipProps = {
  text: string;
  className?: string;
};

/** Texto truncable de celda con su valor completo en tooltip al hover. */
export function TruncatedTextTooltip({
  text,
  className,
}: Readonly<TruncatedTextTooltipProps>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn("block min-w-0 cursor-default truncate", className)}
          />
        }
      >
        {text}
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
