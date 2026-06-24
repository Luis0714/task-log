"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopilotChatMessage } from "@/components/copilot/copilot-chat-message";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { NeosIaWelcome } from "@/components/neos-ia/neos-ia-welcome";
import { PageHeader } from "@/components/layout/page-header";
import {
  NeosIaDraftProvider,
  useNeosIaDraft,
} from "@/hooks/use-neos-ia-draft";
import { useCopilot } from "@/hooks/use-copilot";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import type { SprintContext } from "@/lib/agent";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import { cn } from "@/lib/utils";

export type NeosIaViewProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  sprintContext?: SprintContext;
  userInitials?: string | null;
};

export function NeosIaView({
  adoExecutionReady,
  authMethod,
  sprintContext,
  userInitials,
}: Readonly<NeosIaViewProps>) {
  return (
    <NeosIaViewInner
      adoExecutionReady={adoExecutionReady}
      authMethod={authMethod}
      sprintContext={sprintContext}
      userInitials={userInitials}
    />
  );
}

function NeosIaViewInner({
  adoExecutionReady,
  authMethod,
  sprintContext,
  userInitials,
}: Readonly<NeosIaViewProps>) {
  const { appendEntry } = useCopilotHistory();
  const copilot = useCopilot({ appendHistory: appendEntry, sprintContext });
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = copilot.messages.length > 0;

  // Auto-scroll to the latest message, but only if the user is already near
  // the bottom of the thread (don't yank them away from history they're
  // reading). 240px is the typical "close enough" threshold.
  useEffect(() => {
    const node = threadScrollRef.current;
    if (!node) return;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    if (distanceFromBottom < 240) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [copilot.messages.length]);

  // Keep the draft context value in sync with the hook state so the welcome
  // chips can pre-fill the footer's textarea through the shared provider.
  const setDraft = useCallback(
    (next: string) => copilot.setMessage(next),
    [copilot],
  );

  return (
    <NeosIaDraftProvider value={copilot.message} setValue={setDraft}>
      <NeosIaSurface
        copilot={copilot}
        hasMessages={hasMessages}
        threadEndRef={threadEndRef}
        threadScrollRef={threadScrollRef}
        sprintContext={sprintContext}
        adoExecutionReady={adoExecutionReady}
        authMethod={authMethod}
        userInitials={userInitials}
      />
    </NeosIaDraftProvider>
  );
}

type NeosIaSurfaceProps = {
  copilot: ReturnType<typeof useCopilot>;
  hasMessages: boolean;
  threadEndRef: React.RefObject<HTMLDivElement | null>;
  threadScrollRef: React.RefObject<HTMLDivElement | null>;
  sprintContext?: SprintContext;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  userInitials?: string | null;
};

function NeosIaSurface({
  copilot,
  hasMessages,
  threadEndRef,
  threadScrollRef,
  sprintContext,
  adoExecutionReady,
  authMethod,
  userInitials,
}: Readonly<NeosIaSurfaceProps>) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header — shrink-0 so it never compresses. The "Nueva conversación"
          button sits at the END of the description line (not stacked below
          the title). On mobile the button label collapses to icon-only so the
          description doesn't push the button out of the viewport. */}
      <header className="flex shrink-0 flex-col gap-2 pb-3">
        <PageHeader title="Neos IA" />

        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            hasMessages ? "justify-between" : "justify-start",
          )}
        >
          <p
            className={cn(
              "text-muted-foreground min-w-0 flex-1 text-pretty text-sm sm:text-base",
              hasMessages && "truncate",
            )}
          >
            {hasMessages
              ? "Conversación activa. Cuéntame cómo continúas."
              : "Tu copiloto para reportar horas en lenguaje natural."}
          </p>
          {hasMessages ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copilot.clearConversation}
              className="shrink-0"
            >
              <MessageSquarePlus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Nueva conversación</span>
              <span className="sr-only">Nueva conversación</span>
            </Button>
          ) : null}
        </div>
      </header>

      {/* Central area — fills remaining height, scrolls internally. The
          footer sits below this scroll region so it stays visible regardless
          of content length. */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={threadScrollRef}
          className="flex-1 overflow-y-auto"
          aria-live="polite"
          aria-relevant="additions"
        >
          {hasMessages ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4 xl:max-w-4xl">
              {copilot.messages.map((msg) => (
                <CopilotChatMessage
                  key={msg.id}
                  msg={msg}
                  sprintContext={sprintContext}
                  adoExecutionReady={adoExecutionReady}
                  authMethod={authMethod}
                  loadingExecute={copilot.loadingExecute}
                  userInitials={userInitials}
                  onConfirmTasks={(tasks) => copilot.executeCreateTasks(tasks)}
                  onConfirmLogWork={(items) => copilot.execute(items)}
                  onPickPbi={(id) => copilot.submitPbiId(id)}
                  onPickOption={(value) => copilot.submitOptionValue(value)}
                  onCancel={copilot.dismissPreview}
                />
              ))}
              <div ref={threadEndRef} />
            </div>
          ) : (
            <NeosIaWelcomeSurface>
              <NeosIaWelcomeInner />
            </NeosIaWelcomeSurface>
          )}
        </div>

        {/* Footer — sits below the scroll region */}
        <footer
          role="contentinfo"
          aria-label="Entrada de mensaje de Neos IA"
          className="bg-background shrink-0 border-t px-2 py-3 sm:px-0"
        >
          <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">
            <CopilotInput
              value={copilot.message}
              onChange={copilot.setMessage}
              onSubmit={() => copilot.interpret()}
              loading={copilot.loadingPreview}
              placeholder={
                hasMessages
                  ? "Responde o agrega más información..."
                  : "Ej: Hoy trabajé 2h en la HU-102 y 1h revisando PRs"
              }
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

function NeosIaWelcomeSurface({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">{children}</div>
  );
}

function NeosIaWelcomeInner() {
  const { setValue, focusTextarea } = useNeosIaDraft();

  const onPickPrompt = (prompt: string) => {
    setValue(prompt);
    // Defer focus to the next tick so the textarea has the new value first.
    requestAnimationFrame(() => focusTextarea());
  };

  return <NeosIaWelcome onPickPrompt={onPickPrompt} />;
}
