"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type AdoFiltersCollapsibleProps = {
  title?: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdoFiltersCollapsible({
  title = "Filtros",
  summary,
  defaultOpen = false,
  children,
  className,
}: AdoFiltersCollapsibleProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "group/ado-filters overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto min-h-11 w-full items-center justify-between gap-3 rounded-none px-4 py-3 text-left font-normal hover:bg-muted/50"
          />
        }
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="text-muted-foreground mt-0.5 block text-pretty text-xs leading-snug line-clamp-2">
            {summary}
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-data-[open]/ado-filters:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-4 pt-4 pb-4">
        <div className="flex flex-col gap-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
