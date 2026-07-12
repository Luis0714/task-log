"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmEditDialog } from "@/components/assignments/confirm-edit-dialog";
import type { AssignmentRow } from "@/hooks/assignments/use-assignments";
import { cn } from "@/lib/utils";

import type { OpResult } from "./types";

const DELETE_DESCRIPTION =
  "Esta acción no se puede deshacer. La fila volverá a su estado por defecto (100% en el equipo del usuario).";

type AssignmentRowDesktopProps = Readonly<{
  row: AssignmentRow;
  onEdit: () => void;
  onDelete: () => OpResult;
}>;

export function AssignmentRowDesktop({
  row,
  onEdit,
  onDelete,
}: AssignmentRowDesktopProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <tr
        className={cn(
          "border-border/40 border-t transition-opacity",
          row.pending && "opacity-60",
        )}
      >
        <td className="px-3 py-2 font-medium">
          <div className="flex items-center gap-2">
            {row.personDisplayName}
            {row.pending ? (
              <Loader2
                className="text-muted-foreground size-3 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground">{row.projectName}</td>
        <td className="px-3 py-2 text-muted-foreground">
          {row.teamName ?? "—"}
        </td>
        <td className="px-3 py-2 text-right font-mono">{row.assignmentPct}%</td>
        <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
          {row.validFrom.slice(0, 10)}
        </td>
        <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
          {row.validTo ? row.validTo.slice(0, 10) : "—"}
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
                    aria-label="Editar asignación"
                    onClick={onEdit}
                    disabled={row.pending}
                  />
                }
              >
                <Pencil className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Eliminar asignación"
                    onClick={() => setConfirmDelete(true)}
                    disabled={row.pending}
                    className="text-muted-foreground hover:text-destructive"
                  />
                }
              >
                <Trash2 className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Eliminar asignación</TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
      {confirmDelete ? (
        <ConfirmEditDialog
          open
          onOpenChange={(next) => {
            if (!next) setConfirmDelete(false);
          }}
          title="Eliminar asignación"
          description={DELETE_DESCRIPTION}
          confirmLabel="Eliminar"
          onConfirm={async () => {
            const result = await onDelete();
            if (result.ok) setConfirmDelete(false);
            return result.ok;
          }}
        />
      ) : null}
    </>
  );
}
