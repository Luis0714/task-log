"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildSprintGoalShareDownloadFilename,
} from "@/lib/sprints/format-sprint-goal-share";
import {
  buildSprintGoalShareImageUrl,
  fetchSprintGoalShareImageBlob,
  type SprintGoalShareQuery,
} from "@/services/sprints/sprint-goal-share.service";

export type UseSprintGoalShareOptions = SprintGoalShareQuery & {
  canShare: boolean;
};

export type UseSprintGoalShareResult = {
  open: boolean;
  setOpen: (open: boolean) => void;
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  canShareNative: boolean;
  downloadImage: () => Promise<void>;
  shareImage: () => Promise<void>;
};

function revokeObjectUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function useSprintGoalShare({
  canShare,
  ...query
}: UseSprintGoalShareOptions): UseSprintGoalShareResult {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareQuery = useMemo(
    () => ({
      project: query.project.trim(),
      team: query.team.trim(),
      sprintPath: query.sprintPath.trim(),
      sprintName: query.sprintName.trim(),
      sprintStartDate: query.sprintStartDate?.trim(),
      sprintFinishDate: query.sprintFinishDate?.trim(),
    }),
    [
      query.project,
      query.team,
      query.sprintPath,
      query.sprintName,
      query.sprintStartDate,
      query.sprintFinishDate,
    ],
  );

  const downloadFilename = useMemo(
    () => buildSprintGoalShareDownloadFilename(shareQuery.sprintName, new Date()),
    [shareQuery.sprintName],
  );

  const canShareNative = useMemo(() => {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    return typeof navigator.canShare === "function";
  }, []);

  useEffect(() => {
    if (!open || !canShare) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setImageBlob(null);
    setPreviewUrl((current) => {
      revokeObjectUrl(current);
      return null;
    });

    void fetchSprintGoalShareImageBlob(shareQuery, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        const nextUrl = URL.createObjectURL(blob);
        setImageBlob(blob);
        setPreviewUrl(nextUrl);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo generar la imagen del objetivo del sprint.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, canShare, shareQuery]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(previewUrl);
    };
  }, [previewUrl]);

  const downloadImage = useCallback(async () => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadFilename;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = buildSprintGoalShareImageUrl(shareQuery);
    anchor.download = downloadFilename;
    anchor.click();
  }, [downloadFilename, imageBlob, shareQuery]);

  const shareImage = useCallback(async () => {
    const blob =
      imageBlob ?? (await fetchSprintGoalShareImageBlob(shareQuery));

    const file = new File([blob], downloadFilename, { type: "image/png" });

    if (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `Objetivo del sprint — ${shareQuery.sprintName}`,
        text: `Objetivo del sprint ${shareQuery.sprintName}`,
      });
      return;
    }

    await downloadImage();
  }, [downloadFilename, downloadImage, imageBlob, shareQuery]);

  return {
    open,
    setOpen,
    previewUrl,
    loading,
    error,
    canShareNative,
    downloadImage,
    shareImage,
  };
}
