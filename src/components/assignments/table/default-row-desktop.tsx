"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

import type { InferredDefaultRow } from "./types";

type DefaultRowDesktopProps = Readonly<{
  row: InferredDefaultRow;
  onCreate: () => void;
}>;

export function DefaultRowDesktop({ row, onCreate }: DefaultRowDesktopProps) {
  return (
    <tr className="border-border/40 border-t">
      <td className="px-3 py-2 font-medium">{row.personDisplayName}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.projectName}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.teamName ?? "—"}</td>
      <td className="px-3 py-2 text-right font-mono">100%</td>
      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
        {toLocalDateKey(new Date())}
      </td>
      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
        —
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Crear asignación"
                  onClick={onCreate}
                />
              }
            >
              <Plus className="size-3.5" aria-hidden />
            </TooltipTrigger>
            <TooltipContent>Crear asignación</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
