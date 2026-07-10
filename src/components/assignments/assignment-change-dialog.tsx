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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import { appToast } from "@/lib/toast";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";
import { ASSIGNMENT_USER_MESSAGES } from "@/lib/assignments/error-codes";
import type { AssignmentRoleOption, ChangeAssignmentPayload } from "@/services/assignments/assignments.service";

export type AssignmentChangeDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  assignment: AssignmentDto;
  roles: AssignmentRoleOption[];
  onSubmit: (payload: ChangeAssignmentPayload) => Promise<boolean>;
};

function todayKey(): string {
  return toLocalDateKey(new Date());
}

export function AssignmentChangeDialog({
  open,
  onOpenChange,
  assignment,
  roles,
  onSubmit,
}: AssignmentChangeDialogProps) {
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pct, setPct] = useState(String(assignment.assignmentPct));
  const [roleId, setRoleId] = useState(assignment.roleId);
  const [validFrom, setValidFrom] = useState(todayKey());

  useEffect(() => {
    if (!open) return;
    setPct(String(assignment.assignmentPct));
    setRoleId(assignment.roleId);
    setValidFrom(todayKey());
    setError(null);
  }, [open, assignment]);

  const canSubmit = Boolean(
    roleId &&
    pct.trim() !== "" &&
    Number.isInteger(Number(pct)) &&
    Number(pct) >= 1 &&
    Number(pct) <= 100 &&
    validFrom,
  );

  const onSave = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const ok = await onSubmit({
      newAssignmentPct: Number(pct),
      newRoleId: roleId,
      validFrom,
    });
    setSubmitting(false);
    if (ok) {
      appToast.success("Asignación actualizada.");
      onOpenChange(false);
    } else {
      setError(ASSIGNMENT_USER_MESSAGES.conflictProject);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar asignación</DialogTitle>
          <DialogDescription>
            Cierra la vigencia actual con fecha {validFrom ? `anterior a ${validFrom}` : ""}{" "}
            y crea una nueva desde {validFrom}. El histórico se conserva.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="Persona">
            <Input value={assignment.personDisplayName} readOnly disabled />
          </Field>

          <Field label="Proyecto">
            <Input value={assignment.projectName} readOnly disabled />
          </Field>

          <Field label="Nuevo rol">
            <Select
              value={roleId}
              onValueChange={(v) => setRoleId(v ?? "")}
              disabled={submitting}
            >
              <SelectTrigger id={`${formId}-role`}>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Nuevo % de asignación">
            <Input
              id={`${formId}-pct`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field
            label="Fecha de inicio del cambio"
            description="La vigencia anterior se cierra el día anterior."
          >
            <DatePicker
              id={`${formId}-valid-from`}
              value={validFrom}
              onChange={setValidFrom}
              min={todayKey()}
              disabled={submitting}
            />
          </Field>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={submitting} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
    </div>
  );
}
