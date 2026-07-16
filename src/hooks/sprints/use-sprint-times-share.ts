"use client";

import { useCallback, useMemo, useState } from "react";

import { useSprintShareExport } from "@/hooks/sprints/use-sprint-share-export";
import { buildSprintTimesShareDownloadFilename } from "@/lib/sprints/format-sprint-times-share";
import {
  isSprintTimesShareVariantEnabled,
  resolveSprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-eligibility";
import {
  isSprintTimesShareVariantSelected,
  type SprintTimesShareVariant,
  type SprintTimesShareVariantSelection,
} from "@/lib/sprints/sprint-times-share-variant";
import { normalizeSprintShareScope } from "@/lib/sprints/sprint-share-scope";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import {
  buildSprintTimesShareImageUrl,
  fetchSprintTimesShareImageBlob,
  type SprintTimesShareQuery,
} from "@/services/sprints/sprint-times-share.service";

export type UseSprintTimesShareOptions = Omit<SprintTimesShareQuery, "variant" | "times"> & {
  times: SprintTimesMetrics;
  canShare: boolean;
  /**
   * Variante que refleja lo que el usuario ve en pantalla (filtro de semanas).
   * Al abrir el diálogo queda preseleccionada y la imagen se genera de
   * inmediato, sin esperar una selección manual.
   */
  initialVariant?: SprintTimesShareVariant;
};

export type UseSprintTimesShareResult = ReturnType<typeof useSprintShareExport> & {
  times: SprintTimesMetrics;
  variant: SprintTimesShareVariantSelection;
  setVariant: (variant: SprintTimesShareVariant) => void;
  isVariantEnabled: (variant: SprintTimesShareVariant) => boolean;
  /** Nombre del sprint que se está compartiendo (para títulos dinámicos). */
  sprintName: string;
};

const TIMES_SHARE_MESSAGES = {
  fetch: "No se pudo generar la imagen de tiempos del sprint.",
  download: "No se pudo descargar la imagen.",
  share: "No se pudo compartir la imagen.",
  copy: "No se pudo copiar la imagen al portapapeles.",
  copySuccess: "Imagen copiada al portapapeles.",
} as const;

export function useSprintTimesShare({
  canShare,
  times,
  initialVariant,
  ...query
}: UseSprintTimesShareOptions): UseSprintTimesShareResult {
  const [dialogVariant, setDialogVariant] =
    useState<SprintTimesShareVariantSelection>(null);
  const variant: SprintTimesShareVariantSelection =
    dialogVariant ?? initialVariant ?? null;

  const effectiveVariant: SprintTimesShareVariant | null =
    isSprintTimesShareVariantSelected(variant) &&
    isSprintTimesShareVariantEnabled(times, variant)
      ? variant
      : null;

  const shareQuery = useMemo((): SprintTimesShareQuery | null => {
    if (!effectiveVariant) return null;
    return {
      ...normalizeSprintShareScope(query),
      goalOnly: query.goalOnly,
      variant: resolveSprintTimesShareVariant(times, effectiveVariant),
      times,
    };
  }, [
    query.project,
    query.team,
    query.sprintPath,
    query.sprintName,
    query.sprintStartDate,
    query.sprintFinishDate,
    query.goalOnly,
    times,
    effectiveVariant,
  ]);

  const isVariantEnabled = useCallback(
    (value: SprintTimesShareVariant) => isSprintTimesShareVariantEnabled(times, value),
    [times],
  );

  const setVariant = useCallback(
    (value: SprintTimesShareVariant) => {
      if (!isSprintTimesShareVariantEnabled(times, value)) return;
      setDialogVariant(value);
    },
    [times],
  );

  const fetchBlob = useCallback(
    (signal?: AbortSignal) => {
      if (!shareQuery) return Promise.resolve(new Blob());
      return fetchSprintTimesShareImageBlob(shareQuery, signal);
    },
    [shareQuery],
  );

  const buildFilename = useCallback(() => {
    if (!shareQuery) return `tiempos-sprint-${Date.now()}.png`;
    return buildSprintTimesShareDownloadFilename(
      shareQuery.sprintName,
      shareQuery.variant,
    );
  }, [shareQuery]);

  const buildUrl = useCallback(() => {
    if (!shareQuery) return "";
    return buildSprintTimesShareImageUrl(shareQuery);
  }, [shareQuery]);

  const exportResult = useSprintShareExport({
    canShare,
    reloadKey: shareQuery,
    fetchBlob,
    buildFilename,
    buildUrl,
    mimeType: "image/png",
    messages: TIMES_SHARE_MESSAGES,
    shareMeta: {
      title: `Tiempos del sprint — ${shareQuery?.sprintName ?? "sprint"}`,
      text: `Tiempos del sprint ${shareQuery?.sprintName ?? "sprint"}`,
    },
  });

  const { setOpen: setExportOpen } = exportResult;
  const setOpen = useCallback(
    (open: boolean) => {
      if (open) setDialogVariant(null);
      setExportOpen(open);
    },
    [setExportOpen],
  );

  return {
    ...exportResult,
    setOpen,
    times,
    variant,
    setVariant,
    isVariantEnabled,
    sprintName: query.sprintName,
  };
}
