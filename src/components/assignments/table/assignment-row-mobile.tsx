"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmEditDialog } from "@/components/assignments/confirm-edit-dialog";
import type { AssignmentRow } from "@/hooks/assignments/use-assignments";
import { cn } from "@/lib/utils";

import type { OpResult } from "./types";

type AssignmentRowMobileProps = Readonly<{
  row: AssignmentRow;
  onEdit: () => void;
  onDelete: () => OpResult;
}>;

export function AssignmentRowMobile({
  row,
  onEdit,
  onDelete,
}: AssignmentRowMobileProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li
      className={cn(
        "rounded-lg border bg-card p-3 transition-opacity",
        row.pending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{row.personDisplayName}</span>
            {row.pending ? (
              <Loader2
                className="text-muted-foreground size-3 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {row.projectName}
            {row.teamName ? ` · ${row.teamName}` : ""}
          </p>
        </div>
        <span className="font-mono text-sm">{row.assignmentPct}%</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {row.validFrom.slice(0, 10)}
        {row.validTo ? ` → ${row.validTo.slice(0, 10)}` : " →"}
      </p>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
          disabled={row.pending}
        >
          Editar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setConfirmDelete(true)}
          disabled={row.pending}
          className="text-destructive"
        >
          Eliminar
        </Button>
      </div>
      {confirmDelete ? (
        <ConfirmEditDialog
          open
          onOpenChange={(next) => {
            if (!next) setConfirmDelete(false);
          }}
          title="Eliminar asignación"
          description="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={async () => {
            const result = await onDelete();
            if (result.ok) setConfirmDelete(false);
            return result.ok;
          }}
        />
      ) : null}
    </li>
  );
}
