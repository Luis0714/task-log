"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appToast } from "@/lib/toast";
import {
  AssignmentDialogFooter,
  PercentageField,
  ProjectTeamFields,
  SectionLabel,
  ValidityFields,
  validateAssignmentDraft,
} from "@/components/assignments/assignment-form-fields";
import type {
  EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";
import type {
  InferredDefaultRow,
  TeamOptionsByProject,
} from "@/components/assignments/table/types";
import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

export type DefaultCreateDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (next: boolean) => void;
  defaultRow: InferredDefaultRow;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptionsByProject: TeamOptionsByProject;
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
  teamOptionsByProject,
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

  const teamOptions = teamOptionsByProject[draft.projectId] ?? [];
  const { pctValid, canSubmit, pctError, endError, projectError } =
    validateAssignmentDraft(draft);

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

          <ProjectTeamFields
            idPrefix="default"
            draft={draft}
            onDraftChange={setDraft}
            projectOptions={projectOptions}
            teamOptions={teamOptions}
            disabled={submitting}
            projectError={projectError}
          />

          <ValidityFields
            idPrefix="default"
            draft={draft}
            onDraftChange={setDraft}
            disabled={submitting}
            endError={endError}
          />

          <PercentageField
            value={draft.pct}
            onChange={(next) => setDraft((d) => ({ ...d, pct: next }))}
            disabled={submitting}
            invalid={!pctValid}
            error={pctError}
          />
        </div>

        <AssignmentDialogFooter
          submitting={submitting}
          canSubmit={canSubmit}
          submitLabel="Crear asignación"
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
