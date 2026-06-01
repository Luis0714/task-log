"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSprintShareExport } from "@/hooks/sprints/use-sprint-share-export";
import { buildSprintTimesShareDownloadFilename } from "@/lib/sprints/format-sprint-times-share";
import {
  isSprintTimesShareVariantEnabled,
  resolveDefaultSprintTimesShareVariant,
  resolveSprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-eligibility";
import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import { normalizeSprintShareScope } from "@/lib/sprints/sprint-share-scope";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import {
  buildSprintTimesShareImageUrl,
  fetchSprintTimesShareImageBlob,
  type SprintTimesShareQuery,
} from "@/services/sprints/sprint-times-share.service";

export type UseSprintTimesShareOptions = Omit<SprintTimesShareQuery, "variant"> & {
  times: SprintTimesMetrics;
  canShare: boolean;
};

export type UseSprintTimesShareResult = ReturnType<typeof useSprintShareExport> & {
  variant: SprintTimesShareVariant;
  setVariant: (variant: SprintTimesShareVariant) => void;
  isVariantEnabled: (variant: SprintTimesShareVariant) => boolean;
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
  ...query
}: UseSprintTimesShareOptions): UseSprintTimesShareResult {
  const [variant, setVariantState] = useState<SprintTimesShareVariant>(
    resolveDefaultSprintTimesShareVariant(),
  );

  const shareQuery = useMemo(
    (): SprintTimesShareQuery => ({
      ...normalizeSprintShareScope(query),
      goalOnly: query.goalOnly,
      variant: resolveSprintTimesShareVariant(times, variant),
    }),
    [
      query.project,
      query.team,
      query.sprintPath,
      query.sprintName,
      query.sprintStartDate,
      query.sprintFinishDate,
      query.goalOnly,
      times,
      variant,
    ],
  );

  const isVariantEnabled = useCallback(
    (value: SprintTimesShareVariant) => isSprintTimesShareVariantEnabled(times, value),
    [times],
  );

  const setVariant = useCallback(
    (value: SprintTimesShareVariant) => {
      if (!isSprintTimesShareVariantEnabled(times, value)) return;
      setVariantState(value);
    },
    [times],
  );

  useEffect(() => {
    setVariantState((current) => resolveSprintTimesShareVariant(times, current));
  }, [times]);

  const fetchBlob = useCallback(
    (signal?: AbortSignal) => fetchSprintTimesShareImageBlob(shareQuery, signal),
    [shareQuery],
  );

  const buildFilename = useCallback(
    () => buildSprintTimesShareDownloadFilename(shareQuery.sprintName, shareQuery.variant),
    [shareQuery.sprintName, shareQuery.variant],
  );

  const buildUrl = useCallback(
    () => buildSprintTimesShareImageUrl(shareQuery),
    [shareQuery],
  );

  const exportResult = useSprintShareExport({
    canShare,
    reloadKey: shareQuery,
    fetchBlob,
    buildFilename,
    buildUrl,
    mimeType: "image/png",
    messages: TIMES_SHARE_MESSAGES,
    shareMeta: {
      title: `Tiempos del sprint — ${shareQuery.sprintName}`,
      text: `Tiempos del sprint ${shareQuery.sprintName}`,
    },
  });

  return {
    ...exportResult,
    variant,
    setVariant,
    isVariantEnabled,
  };
}
