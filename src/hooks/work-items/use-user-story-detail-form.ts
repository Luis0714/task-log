"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import { resolveResponsableDraftValue } from "@/lib/work-items/resolve-default-assignee";
import {
  getPbiTransitionKind,
  requiresCommittedDates,
  requiresQaResponsables,
} from "@/lib/work-items/pbi-state-transition";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type UseUserStoryDetailFormOptions = {
  workItem: DashboardWorkItem | null;
  project: string | null;
  team: string | null;
  currentUserDisplayName: string | null;
  members: readonly AdoTeamMemberDto[];
  responsableFields: readonly BacklogResponsableFieldDto[];
  onSaved?: () => void;
  onClose?: () => void;
};

function readStoredSchedulingDate(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed && DATE_KEY_PATTERN.test(trimmed)) return trimmed;
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
  onSaved,
  onClose,
}: UseUserStoryDetailFormOptions) {
  const [draftState, setDraftState] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftTargetDate, setDraftTargetDate] = useState("");
  const [draftMaquetacion, setDraftMaquetacion] = useState("");
  const [draftIntegrador, setDraftIntegrador] = useState("");
  const [draftQa, setDraftQa] = useState("");
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
    };
  }, [workItem, currentUserDisplayName, members]);

  const isStateDirty = Boolean(workItem && draftState !== workItem.state);
  const isDatesDirty =
    Boolean(workItem) &&
    (draftStartDate !== initialSnapshot?.startDate ||
      draftTargetDate !== initialSnapshot?.targetDate);
  const isResponsablesDirty =
    Boolean(workItem) &&
    (draftMaquetacion !== initialSnapshot?.maquetacion ||
      draftIntegrador !== initialSnapshot?.integrador ||
      draftQa !== initialSnapshot?.qa);

  const isDirty = isStateDirty || isDatesDirty || isResponsablesDirty;

  const committedValid =
    !requiresCommittedDates(draftState) ||
    (DATE_KEY_PATTERN.test(draftStartDate) && DATE_KEY_PATTERN.test(draftTargetDate));

  const qaValid =
    !requiresQaResponsables(draftState) ||
    (Boolean(draftMaquetacion.trim()) &&
      Boolean(draftIntegrador.trim()) &&
      Boolean(draftQa.trim()));

  const canSave = Boolean(
    workItem && project && isDirty && committedValid && qaValid && !saving,
  );

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
    transitionKind,
    hasResponsableFields,
    saving,
    canSave,
    save,
  };
}
