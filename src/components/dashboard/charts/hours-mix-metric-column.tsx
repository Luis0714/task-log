"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type HoursMixMetricColumnProps = {
  children: ReactNode;
  className?: string;
};

export function HoursMixMetricColumn({ children, className }: HoursMixMetricColumnProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 sm:min-w-20 sm:px-3 sm:py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
