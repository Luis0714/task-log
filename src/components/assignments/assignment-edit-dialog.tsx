"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { appToast } from "@/lib/toast";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import type {
  EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";
import type { TeamOptionsByProject } from "@/components/assignments/table/types";
import { isPctValueValid } from "@/components/assignments/editable-cells";
import {
  PercentageField,
  SectionLabel,
} from "@/components/assignments/assignment-form-fields";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

export type AssignmentEditDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (next: boolean) => void;
  assignment: AssignmentDto;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptionsByProject: TeamOptionsByProject;
  onSubmit: (id: string, patch: EditAssignmentPayload) => Promise<boolean>;
}>;

/** Parsea "YYYY-MM-DD[Thh:mm:ss...]" → "YYYY-MM-DD". Vacío -> vacío. */
function toDateKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function AssignmentEditDialog({
  open,
  onOpenChange,
  assignment,
  projectOptions,
  teamOptionsByProject,
  onSubmit,
}: AssignmentEditDialogProps) {
  const [draft, setDraft] = useState({
    projectId: assignment.projectId,
    projectName: assignment.projectName,
    teamId: assignment.teamId ?? "",
    teamName: assignment.teamName ?? "",
    roleId: assignment.roleId ?? "",
    pct: String(assignment.assignmentPct),
    validFrom: toDateKey(assignment.validFrom),
    validTo: toDateKey(assignment.validTo),
  });
  const [submitting, setSubmitting] = useState(false);

  const teamOptions = teamOptionsByProject[draft.projectId] ?? [];

  const pctValid = isPctValueValid(draft.pct);
  const endValid = draft.validTo === "" || draft.validTo >= draft.validFrom;
  const projectValid = draft.projectId.trim() !== "";
  const canSubmit = pctValid && endValid && projectValid;

  const pctError = !pctValid ? "Debe ser un número entre 1 y 100." : null;
  const endError = !endValid
    ? "La fecha de fin debe ser igual o posterior a la fecha de inicio."
    : null;
  const projectError = !projectValid ? "Selecciona un proyecto." : null;

  function buildPatch(): EditAssignmentPayload {
    const patch: EditAssignmentPayload = {};
    if (draft.projectId !== assignment.projectId) {
      const p = projectOptions.find((x) => x.value === draft.projectId);
      if (p) {
        patch.projectId = p.value;
        patch.projectName = String(p.label);
      }
    }
    const nextTeamId = draft.teamId || null;
    if (nextTeamId !== (assignment.teamId ?? null)) {
      patch.teamId = nextTeamId;
      patch.teamName = nextTeamId ? draft.teamName : null;
    } else if (draft.teamName !== (assignment.teamName ?? "")) {
      patch.teamName = draft.teamName || null;
    }
    if (draft.roleId !== (assignment.roleId ?? "")) {
      patch.roleId = draft.roleId || null;
    }
    const nextPct = Number(draft.pct);
    if (nextPct !== assignment.assignmentPct) {
      patch.assignmentPct = nextPct;
    }
    if (draft.validFrom !== toDateKey(assignment.validFrom)) {
      patch.validFrom = draft.validFrom || toLocalDateKey(new Date());
    }
    if (draft.validTo !== toDateKey(assignment.validTo)) {
      // "" (borrada) → null explícito para que el backend reabra la vigencia;
      // JSON.stringify omitiría `undefined` y nunca llegaría el cambio.
      patch.validTo = draft.validTo || null;
    }
    return patch;
  }

  async function onSave() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(assignment.id, buildPatch());
    setSubmitting(false);
    if (ok) {
      appToast.success("Asignación actualizada.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Editar asignación
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {assignment.personDisplayName}
            </span>
            {" · "}
            {assignment.projectName}
            {assignment.teamName ? ` · ${assignment.teamName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <SectionLabel>Asignación</SectionLabel>

          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="edit-project">
              Proyecto <span className="text-destructive">*</span>
            </Label>
            <ControlledSelectField
              label=""
              value={draft.projectId}
              placeholder="Selecciona un proyecto"
              options={projectOptions}
              onValueChange={(next) =>
                setDraft((d) => ({
                  ...d,
                  projectId: next,
                  projectName:
                    projectOptions.find((p) => p.value === next)?.label
                      ?.toString() ?? "",
                  teamId: "",
                  teamName: "",
                }))
              }
              disabled={submitting}
              error={projectError}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="edit-team">Equipo</Label>
            <ControlledSelectField
              label=""
              value={draft.teamId}
              placeholder="Sin equipo"
              options={[
                { value: "", label: "Sin equipo", key: "__none__" },
                ...teamOptions,
              ]}
              onValueChange={(next) =>
                setDraft((d) => ({
                  ...d,
                  teamId: next,
                  teamName:
                    teamOptions.find((t) => t.value === next)?.label
                      ?.toString() ?? "",
                }))
              }
              disabled={submitting}
            />
          </div>

          <SectionLabel>Vigencia</SectionLabel>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="edit-valid-from">
              Fecha inicio <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              id="edit-valid-from"
              value={draft.validFrom}
              disabled={submitting}
              onChange={(v) => setDraft((d) => ({ ...d, validFrom: v }))}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="edit-valid-to">Fecha fin (opcional)</Label>
            <DatePicker
              id="edit-valid-to"
              value={draft.validTo}
              min={draft.validFrom}
              disabled={submitting}
              clearable
              onChange={(v) => setDraft((d) => ({ ...d, validTo: v }))}
            />
            <FormInlineError message={endError} />
          </div>

          <p className="text-muted-foreground sm:col-span-2 text-xs">
            Si no indicás fecha fin, la asignación queda vigente hasta que se
            cierre manualmente.
          </p>

          <PercentageField
            value={draft.pct}
            onChange={(next) => setDraft((d) => ({ ...d, pct: next }))}
            disabled={submitting}
            invalid={!pctValid}
            error={pctError}
          />
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={submitting} />}
          >
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
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
