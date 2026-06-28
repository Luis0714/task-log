"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { CopilotClarificationCard } from "@/components/copilot/copilot-clarification-card";
import { CopilotCreateTasksForm } from "@/components/copilot/copilot-create-tasks-form";
import { CopilotInfoListCard } from "@/components/copilot/copilot-info-list-card";
import { CopilotLogWorkForm } from "@/components/copilot/copilot-log-work-form";
import { CopilotOptionsCard } from "@/components/copilot/copilot-options-card";
import { CopilotThinkingIndicator } from "@/components/copilot/copilot-thinking-indicator";
import { cn } from "@/lib/utils";
import type { SprintContext } from "@/lib/agent";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { ConversationMessage } from "@/lib/schemas/conversation";
import type { CreateTaskBatchItem, LogWorkItem } from "@/lib/schemas/agent";

export type CopilotChatMessageProps = {
  msg: ConversationMessage;
  sprintContext?: SprintContext;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loadingExecute: boolean;
  onConfirmTasks: (tasks: CreateTaskBatchItem[]) => void;
  onConfirmLogWork: (items: LogWorkItem[]) => void;
  onPickPbi: (pbiId: number) => void;
  onPickOption: (value: string) => void;
  onCancel: () => void;
};

/**
 * Router por `role` → renderiza la variante correcta del mensaje.
 *
 * Sin burbuja ni fondo para `user` / `assistant`: el texto vive al aire
 * (alineado a la derecha para el usuario, a la izquierda para el asistente)
 * con un avatar sutil solo como ancla visual del lado del asistente.
 * Los previews se renderizan al flujo — sin envolver en una card del mensaje.
 *
 * Cada mensaje entra con `animate-neosia-message-in` (definido en
 * `globals.css`) — fade + slide sutil, respeta `prefers-reduced-motion`.
 */
export function CopilotChatMessage({
  msg,
  sprintContext,
  adoExecutionReady,
  authMethod,
  loadingExecute,
  onConfirmTasks,
  onConfirmLogWork,
  onPickPbi,
  onPickOption,
  onCancel,
}: Readonly<CopilotChatMessageProps>) {
  if (msg.role === "user") {
    return <CopilotUserMessage content={msg.content} />;
  }

  if (msg.role === "assistant") {
    return <CopilotAssistantMessage content={msg.content} />;
  }

  if (msg.role === "thinking") {
    return (
      <CopilotMessageFrame>
        <CopilotThinkingIndicator label={msg.label} iconKind={msg.iconKind} />
      </CopilotMessageFrame>
    );
  }

  if (msg.role === "success") {
    return (
      <CopilotMessageFrame>
        <div
          className={cn(
            "text-muted-foreground flex items-start gap-2 py-1 text-sm",
            "animate-neosia-message-in motion-reduce:animate-none",
          )}
        >
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <span className="text-foreground/80 leading-relaxed">{msg.content}</span>
        </div>
      </CopilotMessageFrame>
    );
  }

  if (msg.role === "error") {
    return (
      <CopilotMessageFrame>
        <div
          role="alert"
          className={cn(
            "text-destructive flex items-start gap-2 py-1 text-sm",
            "animate-neosia-message-in motion-reduce:animate-none",
          )}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="leading-relaxed">{msg.content}</span>
        </div>
      </CopilotMessageFrame>
    );
  }

  if (msg.role === "preview") {
    return (
      <CopilotMessageFrame>
        <div className="animate-neosia-message-in motion-reduce:animate-none">
          <PreviewMessage
            messageId={msg.id}
            preview={msg.preview}
            sprintContext={sprintContext}
            adoExecutionReady={adoExecutionReady}
            authMethod={authMethod}
            loadingExecute={loadingExecute}
            onConfirmTasks={onConfirmTasks}
            onConfirmLogWork={onConfirmLogWork}
            onPickPbi={onPickPbi}
            onPickOption={onPickOption}
            onCancel={onCancel}
          />
        </div>
      </CopilotMessageFrame>
    );
  }

  return null;
}

/**
 * Mensaje del usuario. Sin avatar. Fondo sutilmente tintado con el color
 * primario de la plataforma (`bg-primary/5`) y esquinas redondeadas para
 * diferenciarlo visualmente de la respuesta del asistente, que va limpia
 * sobre el fondo. `max-w-prose` evita líneas incómodamente largas.
 */
function CopilotUserMessage({ content }: Readonly<{ content: string }>) {
  return (
    <CopilotMessageFrame>
      <div
        className={cn(
          "flex justify-end",
          "animate-neosia-message-in motion-reduce:animate-none",
        )}
      >
        <p
          className={cn(
            "bg-primary/5 ring-primary/10 text-foreground max-w-prose rounded-2xl rounded-tr-sm px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap ring-1",
          )}
        >
          {content}
        </p>
      </div>
    </CopilotMessageFrame>
  );
}

/**
 * Mensaje del asistente. Avatar pequeño del isotipo brand a la izquierda,
 * texto plano sin fondo. Usa `max-w-prose` (≈65ch) para mantener un ancho
 * de lectura cómodo sin encerrar el contenido en una card.
 */
function CopilotAssistantMessage({ content }: Readonly<{ content: string }>) {
  return (
    <CopilotMessageFrame>
      <div
        className={cn(
          "flex items-start gap-3",
          "animate-neosia-message-in motion-reduce:animate-none",
        )}
      >
        <span
          aria-hidden
          className="bg-brand-mark/10 text-brand-mark mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md"
        >
          <NeosViewIsotipoBadge className="size-3.5" />
        </span>
        <p className="text-foreground max-w-prose whitespace-pre-wrap text-base leading-relaxed">
          {content}
        </p>
      </div>
    </CopilotMessageFrame>
  );
}

/**
 * Wrapper común que controla la alineación horizontal del bloque dentro
 * del thread y aplica el espaciado vertical entre mensajes. Mantiene la
 * fila anclada al inicio (`items-start`) para que avatars cortos no
 * "estiren" el texto del assistant.
 */
function CopilotMessageFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col items-stretch">{children}</div>;
}

type PreviewMessageProps = Omit<CopilotChatMessageProps, "msg"> & {
  messageId: string;
  preview: Extract<ConversationMessage, { role: "preview" }>["preview"];
};

function PreviewMessage({
  messageId,
  preview,
  sprintContext,
  adoExecutionReady,
  authMethod,
  loadingExecute,
  onConfirmTasks,
  onConfirmLogWork,
  onPickPbi,
  onPickOption,
  onCancel,
}: Readonly<PreviewMessageProps>) {
  if (preview.action === "create_tasks_batch" && sprintContext) {
    return (
      <CopilotCreateTasksForm
        preview={preview}
        sprintPath={sprintContext.sprintPath}
        team={sprintContext.team}
        adoExecutionReady={adoExecutionReady}
        loading={loadingExecute}
        onConfirm={onConfirmTasks}
        onCancel={onCancel}
      />
    );
  }

  if (preview.action === "log_work_batch") {
    return (
      <CopilotLogWorkForm
        preview={preview}
        adoExecutionReady={adoExecutionReady}
        authMethod={authMethod}
        loading={loadingExecute}
        onConfirm={onConfirmLogWork}
        onCancel={onCancel}
      />
    );
  }

  if (preview.action === "question_with_options") {
    return (
      <CopilotOptionsCard
        messageId={messageId}
        payload={preview}
        onSubmit={onPickOption}
        disabled={loadingExecute}
      />
    );
  }

  if (preview.action === "info_list") {
    return <CopilotInfoListCard messageId={messageId} payload={preview} />;
  }

  if (
    preview.action === "needs_clarification" &&
    (preview.candidates?.length ?? 0) > 0
  ) {
    return (
      <CopilotClarificationCard
        preview={preview}
        loading={loadingExecute}
        onPickPbi={onPickPbi}
        onCancel={onCancel}
      />
    );
  }

  return null;
}
