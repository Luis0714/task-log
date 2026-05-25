"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardWorkItem } from "@/lib/dashboard/types";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { resolveDefaultAssignee } from "@/lib/work-items/resolve-default-assignee";
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

function resolveInitialDate(
  primary: string | undefined,
  fallback: string | undefined,
): string {
  const primaryTrimmed = primary?.trim();
  if (primaryTrimmed && DATE_KEY_PATTERN.test(primaryTrimmed)) return primaryTrimmed;

  const fallbackTrimmed = fallback?.trim();
  if (fallbackTrimmed && DATE_KEY_PATTERN.test(fallbackTrimmed)) return fallbackTrimmed;

  return getDefaultWorkingDate();
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
    setDraftStartDate(
      resolveInitialDate(workItem.startDate, workItem.targetDate ?? workItem.workingDate),
    );
    setDraftTargetDate(
      resolveInitialDate(workItem.targetDate, workItem.startDate ?? workItem.workingDate),
    );
    setDraftMaquetacion(workItem.responsableMaquetacion?.trim() ?? "");
    setDraftIntegrador(workItem.responsableIntegrador?.trim() ?? "");
    setDraftQa(workItem.responsableQA?.trim() ?? "");
  }, [workItem]);

  useEffect(() => {
    syncDraftsFromWorkItem();
  }, [syncDraftsFromWorkItem]);

  useEffect(() => {
    if (!workItem || transitionKind !== "qa") return;

    setDraftMaquetacion((current) =>
      current.trim()
        ? current
        : resolveDefaultAssignee(
            workItem.responsableMaquetacion,
            currentUserDisplayName,
            members,
          ),
    );
    setDraftIntegrador((current) =>
      current.trim()
        ? current
        : resolveDefaultAssignee(
            workItem.responsableIntegrador,
            currentUserDisplayName,
            members,
          ),
    );
  }, [workItem, transitionKind, currentUserDisplayName, members]);

  const initialSnapshot = useMemo(() => {
    if (!workItem) return null;
    return {
      state: workItem.state,
      startDate: resolveInitialDate(workItem.startDate, workItem.targetDate ?? workItem.workingDate),
      targetDate: resolveInitialDate(workItem.targetDate, workItem.startDate ?? workItem.workingDate),
      maquetacion: workItem.responsableMaquetacion?.trim() ?? "",
      integrador: workItem.responsableIntegrador?.trim() ?? "",
      qa: workItem.responsableQA?.trim() ?? "",
    };
  }, [workItem]);

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
