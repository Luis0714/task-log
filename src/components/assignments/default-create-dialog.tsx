"use client";

import { useEffect, useState } from "react";
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
import { isPctValueValid } from "@/components/assignments/editable-cells";
import {
  PercentageField,
  SectionLabel,
} from "@/components/assignments/assignment-form-fields";
import type {
  EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";
import type { InferredDefaultRow } from "@/components/assignments/assignments-table";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

export type DefaultCreateDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (next: boolean) => void;
  defaultRow: InferredDefaultRow;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptions: MultiCheckboxFilterOption[];
  onSubmit: (
    row: InferredDefaultRow,
    payload: EditAssignmentPayload,
  ) => Promise<boolean>;
}>;

/**
 * Fecha civil de hoy en formato `YYYY-MM-DD`, calculada con los métodos
 * locales del `Date` (no con `toISOString`) para no caer en el desfase
 * horario: en zonas al oeste de UTC, `toISOString` puede devolver el día
 * siguiente durante la mañana local.
 */
function todayKey(): string {
  return toLocalDateKey(new Date());
}

export function DefaultCreateDialog({
  open,
  onOpenChange,
  defaultRow,
  projectOptions,
  teamOptions,
  onSubmit,
}: DefaultCreateDialogProps) {
  const [draft, setDraft] = useState({
    projectId: defaultRow.projectId,
    projectName: defaultRow.projectName,
    teamId: defaultRow.teamId ?? "",
    teamName: defaultRow.teamName ?? "",
    pct: "100",
    validFrom: todayKey(),
    validTo: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({
        projectId: defaultRow.projectId,
        projectName: defaultRow.projectName,
        teamId: defaultRow.teamId ?? "",
        teamName: defaultRow.teamName ?? "",
        pct: "100",
        validFrom: todayKey(),
        validTo: "",
      });
    }
  }, [open, defaultRow]);

  const pctValid = isPctValueValid(draft.pct);
  const endValid =
    draft.validTo === "" || draft.validTo >= draft.validFrom;
  const projectValid = draft.projectId.trim() !== "";
  const canSubmit = pctValid && endValid && projectValid;

  const pctError = !pctValid
    ? "Debe ser un número entre 1 y 100."
    : null;
  const endError = !endValid
    ? "La fecha de fin debe ser igual o posterior a la fecha de inicio."
    : null;
  const projectError = !projectValid
    ? "Selecciona un proyecto."
    : null;

  function buildPayload(): EditAssignmentPayload {
    return {
      projectId: draft.projectId || defaultRow.projectId,
      projectName: draft.projectName || defaultRow.projectName,
      teamId: draft.teamId ? draft.teamId : null,
      teamName: draft.teamId ? draft.teamName : null,
      assignmentPct: Number(draft.pct),
      validFrom: draft.validFrom,
      validTo: draft.validTo || undefined,
    };
  }

  async function onSave() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(defaultRow, buildPayload());
    setSubmitting(false);
    if (ok) {
      appToast.success("Asignación creada.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Crear asignación
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {defaultRow.personDisplayName}
            </span>{" "}
            se asignará inicialmente al catálogo del equipo. Ajustá los
            valores para crear su primera asignación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <SectionLabel>Asignación</SectionLabel>

          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="default-project">
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
                }))
              }
              disabled={submitting}
              error={projectError}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="default-team">Equipo</Label>
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
            <Label htmlFor="default-valid-from">
              Fecha inicio <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              id="default-valid-from"
              value={draft.validFrom}
              disabled={submitting}
              onChange={(v) => setDraft((d) => ({ ...d, validFrom: v }))}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="default-valid-to">Fecha fin (opcional)</Label>
            <DatePicker
              id="default-valid-to"
              value={draft.validTo}
              min={draft.validFrom}
              disabled={submitting}
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
            Crear asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}