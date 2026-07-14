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
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import type {
  EditAssignmentPayload,
} from "@/services/assignments/assignments.service";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";
import type { TeamOptionsByProject } from "@/components/assignments/table/types";
import {
  AssignmentDialogFooter,
  PercentageField,
  ProjectTeamFields,
  SectionLabel,
  ValidityFields,
  validateAssignmentDraft,
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
  const { pctValid, canSubmit, pctError, endError, projectError } =
    validateAssignmentDraft(draft);

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

          <ProjectTeamFields
            idPrefix="edit"
            draft={draft}
            onDraftChange={setDraft}
            projectOptions={projectOptions}
            teamOptions={teamOptions}
            disabled={submitting}
            projectError={projectError}
          />

          <ValidityFields
            idPrefix="edit"
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
          submitLabel="Guardar cambios"
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
