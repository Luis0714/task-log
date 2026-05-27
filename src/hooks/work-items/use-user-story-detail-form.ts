"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import { resolveResponsableDraftValue } from "@/lib/work-items/resolve-default-assignee";
import { computeDraftCanSave } from "@/lib/forms/can-submit";
import { isDateKeyValid } from "@/lib/validation/date-key";
import {
  getPbiTransitionKind,
  requiresCommittedDates,
  requiresQaResponsables,
} from "@/lib/work-items/pbi-state-transition";
import {
  resolveUserStoryWorkflowTagOption,
  type UserStoryWorkflowTagOption,
} from "@/lib/work-items/user-story-workflow-tags";

export type UseUserStoryDetailFormOptions = {
  workItem: DashboardWorkItem | null;
  project: string | null;
  team: string | null;
  currentUserDisplayName: string | null;
  members: readonly AdoTeamMemberDto[];
  responsableFields: readonly BacklogResponsableFieldDto[];
  statesReady?: boolean;
  onSaved?: () => void;
  onClose?: () => void;
};

function readStoredSchedulingDate(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed && isDateKeyValid(trimmed)) return trimmed;
  return "";
}

/** Fecha guardada en ADO o hoy si el campo está vacío. */
function resolveSchedulingDraftDate(value: string | undefined): string {
  return readStoredSchedulingDate(value) || getTodayDateKey();
}

export function useUserStoryDetailForm({
  workItem,
  project,
  team,
  currentUserDisplayName,
  members,
  responsableFields,
  statesReady = true,
  onSaved,
  onClose,
}: UseUserStoryDetailFormOptions) {
  const [draftState, setDraftState] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftTargetDate, setDraftTargetDate] = useState("");
  const [draftMaquetacion, setDraftMaquetacion] = useState("");
  const [draftIntegrador, setDraftIntegrador] = useState("");
  const [draftQa, setDraftQa] = useState("");
  const [draftWorkflowTag, setDraftWorkflowTag] = useState<UserStoryWorkflowTagOption>("none");
  const [saving, setSaving] = useState(false);

  const transitionKind = useMemo(
    () => (draftState ? getPbiTransitionKind(draftState) : "other"),
    [draftState],
  );

  const hasResponsableFields = responsableFields.length > 0;

  const syncDraftsFromWorkItem = useCallback(() => {
    if (!workItem) return;

    setDraftState(workItem.state);
    setDraftStartDate(resolveSchedulingDraftDate(workItem.startDate));
    setDraftTargetDate(resolveSchedulingDraftDate(workItem.targetDate));
    setDraftMaquetacion(
      resolveResponsableDraftValue(
        workItem.responsableMaquetacion,
        currentUserDisplayName,
        members,
        true,
      ),
    );
    setDraftIntegrador(
      resolveResponsableDraftValue(
        workItem.responsableIntegrador,
        currentUserDisplayName,
        members,
        true,
      ),
    );
    setDraftQa(
      resolveResponsableDraftValue(
        workItem.responsableQA,
        currentUserDisplayName,
        members,
        false,
      ),
    );
    setDraftWorkflowTag(resolveUserStoryWorkflowTagOption(workItem.tags));
  }, [workItem, currentUserDisplayName, members]);

  useEffect(() => {
    syncDraftsFromWorkItem();
  }, [syncDraftsFromWorkItem]);

  const initialSnapshot = useMemo(() => {
    if (!workItem) return null;
    return {
      state: workItem.state,
      startDate: resolveSchedulingDraftDate(workItem.startDate),
      targetDate: resolveSchedulingDraftDate(workItem.targetDate),
      maquetacion: resolveResponsableDraftValue(
        workItem.responsableMaquetacion,
        currentUserDisplayName,
        members,
        true,
      ),
      integrador: resolveResponsableDraftValue(
        workItem.responsableIntegrador,
        currentUserDisplayName,
        members,
        true,
      ),
      qa: resolveResponsableDraftValue(
        workItem.responsableQA,
        currentUserDisplayName,
        members,
        false,
      ),
      workflowTag: resolveUserStoryWorkflowTagOption(workItem.tags),
    };
  }, [workItem, currentUserDisplayName, members]);

  const isStateDirty = Boolean(workItem && draftState !== workItem.state);
  const isWorkflowTagDirty =
    Boolean(workItem) && draftWorkflowTag !== initialSnapshot?.workflowTag;
  const isDatesDirty =
    Boolean(workItem) &&
    (draftStartDate !== initialSnapshot?.startDate ||
      draftTargetDate !== initialSnapshot?.targetDate);
  const isResponsablesDirty =
    Boolean(workItem) &&
    (draftMaquetacion !== initialSnapshot?.maquetacion ||
      draftIntegrador !== initialSnapshot?.integrador ||
      draftQa !== initialSnapshot?.qa);

  const isDirty = isStateDirty || isWorkflowTagDirty || isDatesDirty || isResponsablesDirty;

  const committedValid =
    !requiresCommittedDates(draftState) ||
    (isDateKeyValid(draftStartDate) && isDateKeyValid(draftTargetDate));

  const qaValid =
    !requiresQaResponsables(draftState) ||
    (Boolean(draftMaquetacion.trim()) &&
      Boolean(draftIntegrador.trim()) &&
      Boolean(draftQa.trim()));

  const canSave = computeDraftCanSave({
    isDirty,
    isValid: committedValid && qaValid,
    externalReady: Boolean(workItem && project) && statesReady,
    isSubmitting: saving,
  });

  const save = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!workItem || !project || !canSave) {
      return { ok: false, message: "Completa los campos obligatorios antes de guardar." };
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        project,
        state: draftState,
        workItemKind: "backlog",
      };
      if (team?.trim()) body.team = team.trim();

      if (isDatesDirty || requiresCommittedDates(draftState)) {
        body.startDate = draftStartDate;
        body.targetDate = draftTargetDate;
      }

      if (hasResponsableFields && (isResponsablesDirty || requiresQaResponsables(draftState))) {
        body.responsableMaquetacion = draftMaquetacion.trim();
        body.responsableIntegrador = draftIntegrador.trim();
        body.responsableQA = draftQa.trim();
      }

      if (isWorkflowTagDirty) {
        body.workflowTag = draftWorkflowTag;
      }

      const res = await fetch(`/api/ado/work-items/${workItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string; detail?: string };

      if (!res.ok) {
        const message = [payload.error, payload.detail].filter(Boolean).join(" — ");
        return { ok: false as const, message: message || "No se pudo guardar el estado." };
      }

      onSaved?.();
      onClose?.();
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "No se pudo guardar el estado." };
    } finally {
      setSaving(false);
    }
  }, [
    workItem,
    project,
    team,
    canSave,
    draftState,
    draftStartDate,
    draftTargetDate,
    draftMaquetacion,
    draftIntegrador,
    draftQa,
    isDatesDirty,
    isResponsablesDirty,
    isWorkflowTagDirty,
    draftWorkflowTag,
    hasResponsableFields,
    onSaved,
    onClose,
  ]);

  return {
    draftState,
    setDraftState,
    draftStartDate,
    setDraftStartDate,
    draftTargetDate,
    setDraftTargetDate,
    draftMaquetacion,
    setDraftMaquetacion,
    draftIntegrador,
    setDraftIntegrador,
    draftQa,
    setDraftQa,
    draftWorkflowTag,
    setDraftWorkflowTag,
    transitionKind,
    hasResponsableFields,
    saving,
    canSave,
    save,
  };
}
