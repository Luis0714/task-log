"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSimulatedProgress } from "@/hooks/use-simulated-progress";
import {
  canCopyImageToClipboard,
  copyImageBlobToClipboard,
} from "@/lib/clipboard/copy-image-blob";
import {
  readShareActionError,
  readShareFetchError,
} from "@/lib/sprints/read-share-fetch-error";
import { triggerBlobDownload, triggerDirectDownload } from "@/lib/sprints/trigger-blob-download";
import { appToast } from "@/lib/toast";

export type SprintShareExportMessages = {
  fetch: string;
  download: string;
  share: string;
  copy: string;
  copySuccess: string;
};

export type SprintShareExportShareMeta = {
  title: string;
  text: string;
};

export type UseSprintShareExportOptions = {
  canShare: boolean;
  reloadKey: unknown;
  fetchBlob: (signal?: AbortSignal) => Promise<Blob>;
  buildFilename: () => string;
  buildUrl: () => string;
  mimeType: string;
  /** Descarga vía URL del API (Content-Disposition). Recomendado para PDF. */
  preferDirectDownload?: boolean;
  messages: SprintShareExportMessages;
  shareMeta: SprintShareExportShareMeta;
  copyEnabled?: boolean;
};

export type UseSprintShareExportResult = {
  open: boolean;
  setOpen: (open: boolean) => void;
  previewUrl: string | null;
  loading: boolean;
  progress: number;
  error: string | null;
  canShareNative: boolean;
  canCopyImage: boolean;
  download: () => Promise<void>;
  share: () => Promise<void>;
  copyImage: () => Promise<void>;
};

function revokeObjectUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function useSprintShareExport({
  canShare,
  reloadKey,
  fetchBlob,
  buildFilename,
  buildUrl,
  mimeType,
  preferDirectDownload = false,
  messages,
  shareMeta,
  copyEnabled = true,
}: UseSprintShareExportOptions): UseSprintShareExportResult {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artifactBlob, setArtifactBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const progress = useSimulatedProgress(loading);

  const canShareNative = useMemo(() => {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    return typeof navigator.canShare === "function";
  }, []);

  const canCopyImage = useMemo(() => canCopyImageToClipboard(), []);

  useEffect(() => {
    if (!open || !canShare) {
      setLoading(false);
      return;
    }

    const generation = ++fetchGenerationRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setArtifactBlob(null);
    setPreviewUrl((current) => {
      revokeObjectUrl(current);
      return null;
    });

    void fetchBlob(controller.signal)
      .then((blob) => {
        if (fetchGenerationRef.current !== generation) return;
        setArtifactBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch((cause) => {
        if (fetchGenerationRef.current !== generation) return;
        if (controller.signal.aborted) return;
        setError(readShareFetchError(cause, messages.fetch));
      })
      .finally(() => {
        if (fetchGenerationRef.current === generation) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, canShare, reloadKey, fetchBlob, messages.fetch]);

  useEffect(() => {
    return () => revokeObjectUrl(previewUrl);
  }, [previewUrl]);

  const downloadArtifact = useCallback(
    (blob: Blob) => triggerBlobDownload(blob, buildFilename(), mimeType),
    [buildFilename, mimeType],
  );

  const download = useCallback(async () => {
    try {
      if (preferDirectDownload) {
        triggerDirectDownload(buildUrl());
        return;
      }

      const blob = artifactBlob ?? (await fetchBlob());
      downloadArtifact(blob);
    } catch (cause) {
      const message = readShareActionError(cause, messages.download);
      if (message) appToast.error(message);
    }
  }, [
    artifactBlob,
    buildUrl,
    downloadArtifact,
    fetchBlob,
    messages.download,
    preferDirectDownload,
  ]);

  const share = useCallback(async () => {
    try {
      const blob = artifactBlob ?? (await fetchBlob());
      const file = new File([blob], buildFilename(), { type: mimeType });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: shareMeta.title,
          text: shareMeta.text,
        });
        return;
      }

      if (preferDirectDownload) {
        triggerDirectDownload(buildUrl());
        return;
      }

      downloadArtifact(blob);
    } catch (cause) {
      const message = readShareActionError(cause, messages.share);
      if (message) appToast.error(message);
    }
  }, [
    artifactBlob,
    buildFilename,
    buildUrl,
    downloadArtifact,
    fetchBlob,
    messages.share,
    mimeType,
    preferDirectDownload,
    shareMeta.text,
    shareMeta.title,
  ]);

  const copyImage = useCallback(async () => {
    if (!copyEnabled) return;

    try {
      const blob = artifactBlob ?? (await fetchBlob());
      await copyImageBlobToClipboard(blob);
      appToast.success(messages.copySuccess);
    } catch (cause) {
      const message = readShareActionError(cause, messages.copy);
      if (message) appToast.error(message);
    }
  }, [artifactBlob, copyEnabled, fetchBlob, messages.copy, messages.copySuccess]);

  return {
    open,
    setOpen,
    previewUrl,
    loading,
    progress,
    error,
    canShareNative,
    canCopyImage,
    download,
    share,
    copyImage,
  };
}
