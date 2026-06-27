"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import type { SprintContext } from "@/lib/agent";
import type { CreateTaskBatchItem, LogWorkItem, PreviewResult } from "@/lib/schemas/agent";
import type {
  ConversationMessage,
  ThinkingIconKind,
} from "@/lib/schemas/conversation";
import { THINKING_ICON_KINDS } from "@/lib/schemas/conversation";
import type { ProviderId } from "@/lib/agent/providers/types";
import {
  interpretMessage,
  executeLogWork as apiExecuteLogWork,
  executeCreateTasks as apiExecuteCreateTasks,
} from "@/lib/copilot/copilot.service";
import {
  buildTasksSuccessSummary,
  buildLogWorkSuccessSummary,
  totalHours,
} from "@/lib/copilot/copilot.utils";
import { useConversationStore } from "@/store/conversation-store";
import { CONVERSATION_HISTORY_LIMIT } from "@/lib/copilot/conversation.constants";

export type { ConversationMessage };

type UseCopilotOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  sprintContext?: SprintContext;
  providerId?: ProviderId;
};

// Detects when a provider has burned through its quota (e.g. Gemini free
// tier returns "You exceeded your current quota … limit: 0"). The substring
// match is intentionally loose because the provider's error wording can
// change between releases and the SDK wraps the raw message.
const QUOTA_EXHAUSTED_PATTERN =
  /exceeded your current quota|free_tier_requests|free_tier_input_token_count|rate.?limit/i;

function looksLikeQuotaExhausted(error: string): boolean {
  return QUOTA_EXHAUSTED_PATTERN.test(error);
}

function newAt() { return new Date().toISOString(); }
function newId() { return crypto.randomUUID(); }

const build = {
  user: (content: string): ConversationMessage => ({ role: "user", content, id: newId(), at: newAt() }),
  assistant: (content: string): ConversationMessage => ({ role: "assistant", content, id: newId(), at: newAt() }),
  thinking: (label?: string, iconKind?: ThinkingIconKind): ConversationMessage => ({
    role: "thinking",
    id: newId(),
    at: newAt(),
    ...(label ? { label } : {}),
    ...(iconKind ? { iconKind } : {}),
  }),
  preview: (preview: PreviewResult): ConversationMessage => ({ role: "preview", preview, id: newId(), at: newAt() }),
  success: (content: string): ConversationMessage => ({ role: "success", content, id: newId(), at: newAt() }),
  error: (content: string): ConversationMessage => ({ role: "error", content, id: newId(), at: newAt() }),
};

function historyEntry(summary: string, ok: boolean): CopilotHistoryEntry {
  return { id: newId(), at: newAt(), summary, ok };
}

export function useCopilot({ appendHistory, sprintContext, providerId }: UseCopilotOptions) {
  const [message, setMessage] = useState("");
  const [pendingPreviewId, setPendingPreviewId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);
  const [exhaustedProviders, setExhaustedProviders] = useState<ReadonlySet<ProviderId>>(
    () => new Set(),
  );
  const thinkingIdRef = useRef<string | null>(null);
  const pendingPreviewIdRef = useRef<string | null>(null);

  // Sync ref so callbacks always have the latest pending preview id
  pendingPreviewIdRef.current = pendingPreviewId;

  // Subscribe to the Zustand store for message state
  const messages = useConversationStore((s) => s.messages);

  // Load persisted conversation from localStorage on mount
  useEffect(() => {
    void useConversationStore.persist.rehydrate();
  }, []);

  // Store mutation helpers — these use the store's setState so they never
  // have stale closure issues regardless of deps.
  const push = useCallback((m: ConversationMessage) => {
    useConversationStore.getState()._push(m);
  }, []);

  const replace = useCallback((targetId: string, next: ConversationMessage) => {
    useConversationStore.getState()._replace(targetId, next);
  }, []);

  const remove = useCallback((targetId: string) => {
    useConversationStore.getState()._remove(targetId);
  }, []);

  /**
   * Sends `text` through the interpret pipeline as if the user had typed it
   * into the textarea and pressed Interpretar. Used both by the normal submit
   * path and by the options card when the user picks an option.
   */
  const runPipeline = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Capture conversation history BEFORE adding the current message.
      // Only user/assistant turns are relevant for LLM context.
      const prior = useConversationStore.getState().messages;
      const conversationHistory = prior
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-CONVERSATION_HISTORY_LIMIT)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: (m as { content: string }).content,
        }));

      push(build.user(trimmed));

      const thinking = build.thinking();
      thinkingIdRef.current = thinking.id;
      push(thinking);
      setPendingPreviewId(null);

      // Forward each streamed progress event to the thinking bubble so the
      // user sees live updates ("Buscando historias…", "Encontré 3
      // historias.", etc.) instead of a frozen spinner. The `iconKind`
      // drives which lucide-react icon the indicator renders. We narrow
      // the kind to the schema's literal union and drop unknown values
      // so the schema validator accepts the message.
      const isKnownIconKind = (value: string): value is ThinkingIconKind =>
        (THINKING_ICON_KINDS as readonly string[]).includes(value);
      const onProgress = ({ kind, label }: { kind: string; label: string }) => {
        const id = thinkingIdRef.current;
        if (!id) return;
        replace(id, {
          role: "thinking",
          id,
          at: newAt(),
          label,
          ...(isKnownIconKind(kind) ? { iconKind: kind } : {}),
        });
      };

      const result = await interpretMessage(trimmed, sprintContext, conversationHistory, {
        onProgress,
      });
      thinkingIdRef.current = null;

      if (!result.ok) {
        if (providerId && looksLikeQuotaExhausted(result.error)) {
          const exhaustedId = providerId;
          setExhaustedProviders((prev) => {
            if (prev.has(exhaustedId)) return prev;
            const next = new Set(prev);
            next.add(exhaustedId);
            return next;
          });
        }
        replace(thinking.id, build.error(result.error));
        return;
      }

      // Successful response — if this provider was previously marked as
      // exhausted, the quota must have reset. Clear the marker so the
      // selector UI returns to normal.
      if (providerId) {
        const recoveredId = providerId;
        setExhaustedProviders((prev) => {
          if (!prev.has(recoveredId)) return prev;
          const next = new Set(prev);
          next.delete(recoveredId);
          return next;
        });
      }

      const preview = result.preview;

      if (preview.action === "unsupported") {
        replace(thinking.id, build.assistant(preview.reason));
        return;
      }

      if (preview.action === "question_with_options") {
        replace(thinking.id, build.assistant(preview.question));
        const previewMsg = build.preview(preview);
        setPendingPreviewId(previewMsg.id);
        push(previewMsg);
        return;
      }

      if (preview.action === "info_list") {
        const count = preview.items.length;
        const intro =
          count === 0
            ? `No encontré elementos para "${trimmed}".`
            : count === 1
              ? `Aquí tienes el resultado:`
              : `Aquí tienes los ${count} elementos:`;
        replace(thinking.id, build.assistant(intro));
        const previewMsg = build.preview(preview);
        setPendingPreviewId(previewMsg.id);
        push(previewMsg);
        return;
      }

      const previewMsg = build.preview(preview);
      setPendingPreviewId(previewMsg.id);

      if (preview.action === "needs_clarification") {
        replace(thinking.id, build.assistant(preview.question));
        push(previewMsg);
        return;
      }

      const taskCount =
        preview.action === "create_tasks_batch" ? preview.tasks.length : preview.items.length;
      const hours =
        preview.action === "create_tasks_batch" ? totalHours(preview.tasks) : totalHours(preview.items);
      replace(
        thinking.id,
        build.assistant(
          `Encontré ${taskCount} actividad${taskCount === 1 ? "" : "es"} con ${hours}h en total. Revisa la propuesta y confírmala.`,
        ),
      );
      push(previewMsg);
    },
    [sprintContext, push, replace],
  );

  const interpret = useCallback(async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    setLoadingPreview(true);
    try {
      await runPipeline(text);
    } finally {
      setLoadingPreview(false);
    }
  }, [message, runPipeline]);

  // Used by the options card: dismiss the pending card, then run the pipeline.
  const submitOptionValue = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      // Remove the options card from the conversation thread
      const currentPendingId = pendingPreviewIdRef.current;
      if (currentPendingId) {
        useConversationStore.getState()._remove(currentPendingId);
        setPendingPreviewId(null);
      }
      setLoadingPreview(true);
      try {
        await runPipeline(trimmed);
      } finally {
        setLoadingPreview(false);
      }
    },
    [runPipeline],
  );

  const submitPbiId = useCallback(
    async (pbiId: number) => {
      const currentPendingId = pendingPreviewIdRef.current;
      if (currentPendingId) {
        useConversationStore.getState()._remove(currentPendingId);
        setPendingPreviewId(null);
      }
      setLoadingPreview(true);
      try {
        await runPipeline(`Usa la PBI #${pbiId}`);
      } finally {
        setLoadingPreview(false);
      }
    },
    [runPipeline],
  );

  const dismissPreview = useCallback(() => {
    const currentPendingId = pendingPreviewIdRef.current;
    if (currentPendingId) remove(currentPendingId);
    setPendingPreviewId(null);
  }, [remove]);

  const execute = useCallback(
    async (items: LogWorkItem[]) => {
      if (items.length === 0) return;
      setLoadingExecute(true);

      const response = await apiExecuteLogWork(items);
      setLoadingExecute(false);

      const currentPendingId = pendingPreviewIdRef.current;
      if (currentPendingId) remove(currentPendingId);
      setPendingPreviewId(null);

      const successCount = response.successCount ?? 0;
      const failureCount = response.failureCount ?? 0;

      if (response.error && successCount === 0) {
        push(build.error(response.error ?? USER_MESSAGES.saveFailed));
        appendHistory(historyEntry("Log work — falló", false));
        return;
      }

      const successItems = (response.results ?? [])
        .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
        .map((r) => ({ hours: r.hours, workItemId: r.workItemId }));

      const summary = buildLogWorkSuccessSummary(successItems);
      push(build.success(summary));
      appendHistory(historyEntry(summary, failureCount === 0));
    },
    [appendHistory, push, remove],
  );

  const executeCreateTasks = useCallback(
    async (tasks: CreateTaskBatchItem[]) => {
      if (tasks.length === 0) return;
      setLoadingExecute(true);

      const hours = totalHours(tasks);
      const response = await apiExecuteCreateTasks(tasks);
      setLoadingExecute(false);

      const currentPendingId = pendingPreviewIdRef.current;
      if (currentPendingId) remove(currentPendingId);
      setPendingPreviewId(null);

      const successCount = response.successCount ?? 0;
      const failureCount = response.failureCount ?? 0;

      if (response.error && successCount === 0) {
        push(build.error(response.error ?? USER_MESSAGES.taskCreateFailed));
        appendHistory(historyEntry("Creación de tasks — falló", false));
        return;
      }

      const summary = buildTasksSuccessSummary(response.results, hours);

      if (failureCount > 0 && successCount > 0) {
        push(build.error(`${successCount} tasks creadas, pero ${failureCount} fallaron. Revisa los detalles en Azure DevOps.`));
      } else {
        push(build.success(summary));
      }

      appendHistory(historyEntry(summary, failureCount === 0));
    },
    [appendHistory, push, remove],
  );

  const clearConversation = useCallback(() => {
    useConversationStore.getState().clear();
    setPendingPreviewId(null);
    setMessage("");
  }, []);

  return {
    message,
    setMessage,
    messages,
    loadingPreview,
    loadingExecute,
    exhaustedProviders,
    interpret,
    submitOptionValue,
    submitPbiId,
    execute,
    executeCreateTasks,
    dismissPreview,
    clearConversation,
  };
}
