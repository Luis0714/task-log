"use client";

import { PanelLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type SidebarFloatingExpandTriggerProps = {
  className?: string;
};

export function SidebarFloatingExpandTrigger({
  className,
}: SidebarFloatingExpandTriggerProps) {
  const { state, isMobile, toggleSidebar } = useSidebar();

  if (state !== "collapsed" || isMobile) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            data-slot="sidebar-floating-expand-trigger"
            className={cn(
              "absolute top-4 left-full z-30 size-7 -translate-x-1/2 rounded-full border-border bg-background shadow-md hover:bg-muted",
              className,
            )}
            aria-label="Expandir menú"
            onClick={toggleSidebar}
          />
        }
      >
        <PanelLeftIcon className="size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="right">Expandir menú</TooltipContent>
    </Tooltip>
  );
}
