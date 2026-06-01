"use client";

import { useCallback, useMemo, useState } from "react";

import { useSprintShareExport } from "@/hooks/sprints/use-sprint-share-export";
import { buildSprintGoalShareDownloadFilename } from "@/lib/sprints/format-sprint-goal-share";
import type { SprintGoalShareFormat } from "@/lib/sprints/sprint-goal-share-format";
import { getSprintGoalShareMimeType } from "@/lib/sprints/sprint-goal-share-format";
import { normalizeSprintShareScope } from "@/lib/sprints/sprint-share-scope";
import {
  buildSprintGoalShareUrl,
  fetchSprintGoalShareBlob,
  type SprintGoalShareQuery,
} from "@/services/sprints/sprint-goal-share.service";

export type UseSprintGoalShareOptions = SprintGoalShareQuery & {
  canShare: boolean;
};

export type UseSprintGoalShareResult = ReturnType<typeof useSprintShareExport> & {
  format: SprintGoalShareFormat;
  setFormat: (format: SprintGoalShareFormat) => void;
};

export function useSprintGoalShare({
  canShare,
  ...query
}: UseSprintGoalShareOptions): UseSprintGoalShareResult {
  const [format, setFormat] = useState<SprintGoalShareFormat>("image");

  const shareQuery = useMemo(
    () => normalizeSprintShareScope(query),
    [
      query.project,
      query.team,
      query.sprintPath,
      query.sprintName,
      query.sprintStartDate,
      query.sprintFinishDate,
    ],
  );

  const messages = useMemo(
    () => ({
      fetch:
        format === "pdf"
          ? "No se pudo generar el PDF del objetivo del sprint."
          : "No se pudo generar la imagen del objetivo del sprint.",
      download:
        format === "pdf" ? "No se pudo descargar el PDF." : "No se pudo descargar la imagen.",
      share:
        format === "pdf" ? "No se pudo compartir el PDF." : "No se pudo compartir la imagen.",
      copy: "No se pudo copiar la imagen al portapapeles.",
      copySuccess: "Imagen copiada al portapapeles.",
    }),
    [format],
  );

  const fetchBlob = useCallback(
    (signal?: AbortSignal) => fetchSprintGoalShareBlob(shareQuery, format, signal),
    [shareQuery, format],
  );

  const buildFilename = useCallback(
    () => buildSprintGoalShareDownloadFilename(shareQuery.sprintName, format),
    [shareQuery.sprintName, format],
  );

  const buildUrl = useCallback(
    () => buildSprintGoalShareUrl(shareQuery, format),
    [shareQuery, format],
  );

  const reloadKey = useMemo(
    () =>
      [
        shareQuery.project,
        shareQuery.team,
        shareQuery.sprintPath,
        shareQuery.sprintName,
        shareQuery.sprintStartDate,
        shareQuery.sprintFinishDate,
        format,
      ] as const,
    [shareQuery, format],
  );

  const exportResult = useSprintShareExport({
    canShare,
    reloadKey,
    fetchBlob,
    buildFilename,
    buildUrl,
    mimeType: getSprintGoalShareMimeType(format),
    preferDirectDownload: format === "pdf",
    messages,
    shareMeta: {
      title: `Objetivo del sprint — ${shareQuery.sprintName}`,
      text: `Objetivo del sprint ${shareQuery.sprintName}`,
    },
    copyEnabled: format === "image",
  });

  return {
    ...exportResult,
    format,
    setFormat,
  };
}
