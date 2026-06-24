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
import { areWorkItemTagsEqual } from "@/lib/work-items/ado-work-item-tags";

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

function readWorkItemTags(tags: readonly string[] | undefined): string[] {
  return tags ? [...tags] : [];
}

/** Lee el valor de un Responsable desde el work item, sea cual sea su referenceName. */
function readWorkItemResponsable(
  workItem: DashboardWorkItem,
  referenceName: string,
): string | undefined {
  const wi = workItem as unknown as Record<string, unknown>;
  const value = wi[referenceName];
  return typeof value === "string" ? value : undefined;
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
  const [draftResponsables, setDraftResponsables] = useState<Record<string, string>>({});
  const [draftTags, setDraftTags] = useState<string[]>([]);
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

    const nextResponsables: Record<string, string> = {};
    for (const field of responsableFields) {
      const stored = readWorkItemResponsable(workItem, field.referenceName);
      nextResponsables[field.referenceName] = resolveResponsableDraftValue(
        stored,
        currentUserDisplayName,
        members,
        field.defaultToCurrentUser,
      );
    }
    setDraftResponsables(nextResponsables);

    setDraftTags(readWorkItemTags(workItem.tags));
  }, [workItem, currentUserDisplayName, members, responsableFields]);

  useEffect(() => {
    syncDraftsFromWorkItem();
  }, [syncDraftsFromWorkItem]);

  const initialSnapshot = useMemo(() => {
    if (!workItem) return null;
    const initialResponsables: Record<string, string> = {};
    for (const field of responsableFields) {
      const stored = readWorkItemResponsable(workItem, field.referenceName);
      initialResponsables[field.referenceName] = resolveResponsableDraftValue(
        stored,
        currentUserDisplayName,
        members,
        field.defaultToCurrentUser,
      );
    }
    return {
      state: workItem.state,
      startDate: resolveSchedulingDraftDate(workItem.startDate),
      targetDate: resolveSchedulingDraftDate(workItem.targetDate),
      responsables: initialResponsables,
      tags: readWorkItemTags(workItem.tags),
    };
  }, [workItem, currentUserDisplayName, members, responsableFields]);

  const isStateDirty = Boolean(workItem && draftState !== workItem.state);
  const isTagsDirty =
    Boolean(workItem) &&
    !areWorkItemTagsEqual(draftTags, initialSnapshot?.tags ?? []);
  const isDatesDirty =
    Boolean(workItem) &&
    (draftStartDate !== initialSnapshot?.startDate ||
      draftTargetDate !== initialSnapshot?.targetDate);
  const isResponsablesDirty =
    Boolean(workItem) &&
    responsableFields.some(
      (field) =>
        draftResponsables[field.referenceName] !==
        (initialSnapshot?.responsables[field.referenceName] ?? ""),
    );

  const isDirty = isStateDirty || isTagsDirty || isDatesDirty || isResponsablesDirty;

  const committedValid =
    !requiresCommittedDates(draftState) ||
    (isDateKeyValid(draftStartDate) && isDateKeyValid(draftTargetDate));

  // Para QA, los Responsables con defaultToCurrentUser=true pueden quedarse vacíos
  // (el servidor rellena con el usuario logueado). El resto deben tener valor.
  const qaValid =
    !requiresQaResponsables(draftState) ||
    responsableFields.every((field) => {
      if (field.defaultToCurrentUser) return true;
      return Boolean(draftResponsables[field.referenceName]?.trim());
    });

  const canSave = computeDraftCanSave({
    isDirty,
    isValid: committedValid && qaValid,
    externalReady: Boolean(workItem && project) && statesReady,
    isSubmitting: saving,
  });

  const setResponsableValue = useCallback((referenceName: string, value: string) => {
    setDraftResponsables((prev) => ({ ...prev, [referenceName]: value }));
  }, []);

  const save = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!workItem || !project || !canSave) {
      return { ok: false, message: "Completa los campos obligatorios antes de guardar." };
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        project,
        state: draftState,
        workItemKind: "backlog",
      };
      if (team?.trim()) body.team = team.trim();

      if (isDatesDirty || requiresCommittedDates(draftState)) {
        body.startDate = draftStartDate;
        body.targetDate = draftTargetDate;
      }

      if (
        hasResponsableFields &&
        (isResponsablesDirty || requiresQaResponsables(draftState))
      ) {
        const trimmed: Record<string, string> = {};
        for (const [ref, value] of Object.entries(draftResponsables)) {
          const t = value.trim();
          if (t) trimmed[ref] = t;
        }
        body.responsables = trimmed;
      }

      if (isTagsDirty) {
        body.tags = draftTags;
      }

      const res = await fetch(`/api/ado/work-items/${workItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        return {
          ok: false as const,
          message: payload.error ?? "No se pudo guardar el estado.",
        };
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
    draftResponsables,
    isDatesDirty,
    isResponsablesDirty,
    isTagsDirty,
    draftTags,
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
    draftResponsables,
    setResponsableValue,
    draftTags,
    setDraftTags,
    transitionKind,
    hasResponsableFields,
    saving,
    canSave,
    save,
  };
}