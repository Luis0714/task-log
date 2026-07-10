"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import { appToast } from "@/lib/toast";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";
import type { CloseAssignmentPayload } from "@/services/assignments/assignments.service";

export type AssignmentCloseDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  assignment: AssignmentDto;
  onSubmit: (payload: CloseAssignmentPayload) => Promise<boolean>;
};

function todayKey(): string {
  return toLocalDateKey(new Date());
}

export function AssignmentCloseDialog({
  open,
  onOpenChange,
  assignment,
  onSubmit,
}: AssignmentCloseDialogProps) {
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [validTo, setValidTo] = useState(todayKey());

  useEffect(() => {
    if (open) {
      setValidTo(todayKey());
    }
  }, [open]);

  const onSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({ validTo });
    setSubmitting(false);
    if (ok) {
      appToast.success("Vigencia cerrada.");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar vigencia</DialogTitle>
          <DialogDescription>
            {assignment.personDisplayName} dejará de generar horas esperadas en{" "}
            {assignment.projectName} a partir de la fecha indicada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Persona</Label>
            <Input value={assignment.personDisplayName} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Proyecto</Label>
            <Input value={assignment.projectName} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-valid-to`}>Fecha de cierre</Label>
            <DatePicker
              id={`${formId}-valid-to`}
              value={validTo}
              onChange={setValidTo}
              min={todayKey()}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={submitting} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onSave()}
            disabled={!validTo || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Cerrar vigencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
