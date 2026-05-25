"use client";

import { LogOut, Moon, FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardHeaderData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type DashboardHeaderProps = {
  data: DashboardHeaderData;
  className?: string;
  onProjectChange?: () => void;
  onLogout?: () => void;
};

export function DashboardHeader({
  data,
  className,
  onProjectChange,
  onLogout,
}: DashboardHeaderProps) {
  const firstName = data.displayName.split(" ")[0] ?? data.displayName;

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName} 👋
        </h1>
        <p className="text-muted-foreground truncate text-sm">
          {data.sprintName}
          <span className="mx-1.5 opacity-40">—</span>
          {data.project}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cambiar tema">
          <Moon className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cambiar proyecto"
          onClick={onProjectChange}
        >
          <FolderKanban className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar sesión"
          onClick={onLogout}
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
