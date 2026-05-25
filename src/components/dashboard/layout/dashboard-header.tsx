"use client";

import type { DashboardHeaderData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type DashboardHeaderProps = {
  data: DashboardHeaderData;
  className?: string;
};

export function DashboardHeader({ data, className }: DashboardHeaderProps) {
  const firstName = data.displayName.split(" ")[0] ?? data.displayName;

  return (
    <header className={cn("min-w-0 space-y-1", className)}>
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
        {firstName} 👋
      </h1>
      <p className="text-muted-foreground truncate text-sm">
        {data.sprintName}
        <span className="mx-1.5 opacity-40">—</span>
        {data.project}
      </p>
    </header>
  );
}
