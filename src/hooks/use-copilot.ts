"use client";

import { useCallback, useState } from "react";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { LogWorkPayload, PreviewResult } from "@/lib/schemas/agent";

type UseCopilotOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
};

export function useCopilot({ appendHistory }: UseCopilotOptions) {
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);

  const interpret = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setError(null);
    setPreview(null);
    setLoadingPreview(true);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as { preview?: PreviewResult; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al interpretar");
        return;
      }

      if (data.preview) setPreview(data.preview);
    } catch {
      setError("No se pudo contactar al servidor.");
    } finally {
      setLoadingPreview(false);
    }
  }, [message]);

  const execute = useCallback(
    async (payload: LogWorkPayload) => {
      setError(null);
      setLoadingExecute(true);

      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preview: payload }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          detail?: string;
          newCompletedWork?: number;
        };

        if (!res.ok) {
          setError(
            [data.error, data.detail].filter(Boolean).join(" — ") || "Error al ejecutar",
          );
          appendHistory({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            summary: `Elemento #${payload.workItemId} +${payload.hours}h (falló)`,
            ok: false,
          });
          return;
        }

        setPreview(null);
        setMessage("");
        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary: `Elemento #${payload.workItemId} +${payload.hours}h · Total: ${data.newCompletedWork ?? "—"}h`,
          ok: true,
        });
      } catch {
        setError("No se pudo ejecutar la acción.");
      } finally {
        setLoadingExecute(false);
      }
    },
    [appendHistory],
  );

  const dismissPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    message,
    setMessage,
    preview,
    error,
    loadingPreview,
    loadingExecute,
    interpret,
    execute,
    dismissPreview,
    clearError,
  };
}
