"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { LogWorkPayload } from "@/lib/schemas/agent";
import {
  mapTimeLogFormToPayload,
  TIME_LOG_FORM_DEFAULTS,
  timeLogFormSchema,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";

type UseTimeLogFormOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
};

export function useTimeLogForm({ appendHistory }: UseTimeLogFormOptions) {
  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: TIME_LOG_FORM_DEFAULTS,
    mode: "onTouched",
  });

  const [preview, setPreview] = useState<LogWorkPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingExecute, setLoadingExecute] = useState(false);

  const prepareSubmit = form.handleSubmit((values) => {
    setError(null);
    setPreview(mapTimeLogFormToPayload(values));
  });

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
            summary: `WI #${payload.workItemId} +${payload.hours}h (falló)`,
            ok: false,
          });
          return;
        }

        setPreview(null);
        form.reset(TIME_LOG_FORM_DEFAULTS);
        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary: `WI #${payload.workItemId} +${payload.hours}h · Total: ${data.newCompletedWork ?? "—"}h`,
          ok: true,
        });
      } catch {
        setError("No se pudo ejecutar la acción.");
      } finally {
        setLoadingExecute(false);
      }
    },
    [appendHistory, form],
  );

  const dismissPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    form,
    preview,
    error,
    loadingExecute,
    prepareSubmit,
    execute,
    dismissPreview,
  };
}
