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
  /**
   * Si `true` (por defecto), abre el modal y dispara la generación del artefacto
   * en cuanto el usuario lo abre. Si `false`, el caller debe invocar `trigger()`
   * para iniciar la generación (útil cuando hay que esperar una selección del
   * usuario antes de generar).
   */
  autoGenerateOnOpen?: boolean;
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
  /** Inicia (o reinicia) la generación del artefacto manualmente. */
  trigger: () => void;
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
  autoGenerateOnOpen = true,
}: UseSprintShareExportOptions): UseSprintShareExportResult {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artifactBlob, setArtifactBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const progress = useSimulatedProgress(loading);

  const canShareNative = useMemo(() => {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    return typeof navigator.canShare === "function";
  }, []);

  const canCopyImage = useMemo(() => canCopyImageToClipboard(), []);

  const runFetch = useCallback(() => {
    if (!canShare) {
      setLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const generation = ++fetchGenerationRef.current;
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
        if (!blob || blob.size === 0) return;
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
  }, [canShare, fetchBlob, messages.fetch]);

  useEffect(() => {
    if (!autoGenerateOnOpen) return;
    if (!open) return;
    runFetch();
  }, [open, autoGenerateOnOpen, runFetch]);

  useEffect(() => {
    if (!open) return;
    if (autoGenerateOnOpen) return;
    controllerRef.current?.abort();
    setPreviewUrl((current) => {
      revokeObjectUrl(current);
      return null;
    });
    setArtifactBlob(null);
    setError(null);
    setLoading(false);
  }, [open, autoGenerateOnOpen]);

  useEffect(() => {
    if (!open) return;
    runFetch();
  }, [reloadKey, runFetch]);

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
    trigger: runFetch,
    download,
    share,
    copyImage,
  };
}
