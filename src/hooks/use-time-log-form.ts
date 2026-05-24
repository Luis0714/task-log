"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { useTimeLogCatalog } from "@/hooks/use-time-log-catalog";
import {
  createTimeLogFormDefaults,
  mapTimeLogFormToPayload,
  timeLogFormSchema,
  type TimeLogExecutePayload,
  type TimeLogFormValues,
} from "@/lib/schemas/time-log";
import { appToast } from "@/lib/toast";

type UseTimeLogFormOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  defaultProject?: string | null;
  adoExecutionReady: boolean;
};

export function useTimeLogForm({
  appendHistory,
  defaultProject = null,
  adoExecutionReady,
}: UseTimeLogFormOptions) {
  const defaultProjectRef = useRef(defaultProject ?? "");
  defaultProjectRef.current = defaultProject ?? "";

  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: createTimeLogFormDefaults(defaultProject ?? ""),
    mode: "onTouched",
  });

  const [preview, setPreview] = useState<TimeLogExecutePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingExecute, setLoadingExecute] = useState(false);

  const catalog = useTimeLogCatalog({
    form,
    adoExecutionReady,
    submitting: loadingExecute,
  });

  const prepareSubmit = form.handleSubmit((values) => {
    setError(null);
    setPreview(mapTimeLogFormToPayload(values));
  });

  const execute = useCallback(
    async (payload: TimeLogExecutePayload) => {
      setError(null);
      setLoadingExecute(true);

      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preview: {
              action: payload.action,
              workItemId: payload.workItemId,
              hours: payload.hours,
              comment: payload.comment,
            },
            project: payload.project,
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          detail?: string;
          newCompletedWork?: number;
        };

        if (!res.ok) {
          const message =
            [data.error, data.detail].filter(Boolean).join(" — ") || "Error al ejecutar";
          setError(message);
          appToast.error("No se pudo registrar en Azure DevOps.", {
            description: message,
          });
          appendHistory({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            summary: `WI #${payload.workItemId} +${payload.hours}h (falló)`,
            ok: false,
          });
          return;
        }

        setPreview(null);
        form.reset(createTimeLogFormDefaults(defaultProjectRef.current));
        appToast.success(`Horas registradas en WI #${payload.workItemId}`, {
          description: `+${payload.hours}h · Total acumulado: ${data.newCompletedWork ?? "—"}h`,
        });
        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary: `WI #${payload.workItemId} +${payload.hours}h · Total: ${data.newCompletedWork ?? "—"}h`,
          ok: true,
        });
      } catch {
        const message = "No se pudo ejecutar la acción.";
        setError(message);
        appToast.error(message);
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
    catalog,
    preview,
    error,
    loadingExecute,
    prepareSubmit,
    execute,
    dismissPreview,
  };
}
