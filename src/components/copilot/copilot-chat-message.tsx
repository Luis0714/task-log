"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { CopilotClarificationCard } from "@/components/copilot/copilot-clarification-card";
import { CopilotCreateTasksForm } from "@/components/copilot/copilot-create-tasks-form";
import { CopilotInfoListCard } from "@/components/copilot/copilot-info-list-card";
import { CopilotLogWorkForm } from "@/components/copilot/copilot-log-work-form";
import { CopilotMessageBubble } from "@/components/copilot/copilot-message-bubble";
import { CopilotOptionsCard } from "@/components/copilot/copilot-options-card";
import { CopilotThinkingIndicator } from "@/components/copilot/copilot-thinking-indicator";
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
  userInitials?: string | null;
  onConfirmTasks: (tasks: CreateTaskBatchItem[]) => void;
  onConfirmLogWork: (items: LogWorkItem[]) => void;
  onPickPbi: (pbiId: number) => void;
  onPickOption: (value: string) => void;
  onCancel: () => void;
};

export function CopilotChatMessage({
  msg,
  sprintContext,
  adoExecutionReady,
  authMethod,
  loadingExecute,
  userInitials,
  onConfirmTasks,
  onConfirmLogWork,
  onPickPbi,
  onPickOption,
  onCancel,
}: Readonly<CopilotChatMessageProps>) {
  if (msg.role === "user" || msg.role === "assistant") {
    return (
      <CopilotMessageBubble
        role={msg.role}
        content={msg.content}
        userInitials={userInitials}
      />
    );
  }

  if (msg.role === "thinking") {
    return <CopilotThinkingIndicator label={msg.label} iconKind={msg.iconKind} />;
  }

  if (msg.role === "success") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{msg.content}</span>
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{msg.content}</span>
      </div>
    );
  }

  if (msg.role === "preview") {
    return (
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
    );
  }

  return null;
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

  if (preview.action === "needs_clarification" && (preview.candidates?.length ?? 0) > 0) {
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
