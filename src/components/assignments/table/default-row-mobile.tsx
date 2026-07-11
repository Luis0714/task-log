"use client";

import { Button } from "@/components/ui/button";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

import type { InferredDefaultRow } from "./types";

type DefaultRowMobileProps = Readonly<{
  row: InferredDefaultRow;
  onCreate: () => void;
}>;

export function DefaultRowMobile({ row, onCreate }: DefaultRowMobileProps) {
  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{row.personDisplayName}</span>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {row.projectName}
            {row.teamName ? ` · ${row.teamName}` : ""}
          </p>
        </div>
        <span className="font-mono text-sm">100%</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {toLocalDateKey(new Date())} →
      </p>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          Crear
        </Button>
      </div>
    </li>
  );
}
