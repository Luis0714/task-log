"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopilotChatMessage } from "@/components/copilot/copilot-chat-message";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { NeosIaWelcome } from "@/components/neos-ia/neos-ia-welcome";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderSelector } from "@/components/neos-ia/provider-selector";
import {
  NeosIaDraftProvider,
  useNeosIaDraft,
} from "@/hooks/use-neos-ia-draft";
import { useCopilot } from "@/hooks/use-copilot";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useProviderPreference } from "@/hooks/use-provider-preference";
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
  const { providerId, changeProvider } = useProviderPreference();
  const copilot = useCopilot({
    appendHistory: appendEntry,
    sprintContext,
    providerId,
  });
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const hasMessages = copilot.messages.length > 0;

  // Track whether the user is "pinned" to the bottom. When they scroll up,
  // unpin so we don't yank them away from history they're reading. When they
  // scroll back down close to the bottom, re-pin automatically.
  useEffect(() => {
    const node = threadScrollRef.current;
    if (!node) return;
    const onScroll = () => {
      const distanceFromBottom =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      pinnedRef.current = distanceFromBottom < 80;
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  // When the user sends a message, force-pin so they always see the response.
  useEffect(() => {
    if (copilot.loadingPreview) {
      pinnedRef.current = true;
    }
  }, [copilot.loadingPreview]);

  // Auto-scroll on every message change (push AND replace), not just length.
  // This covers: user message added, thinking indicator added, thinking
  // replaced by assistant reply, preview card added.
  useEffect(() => {
    if (!pinnedRef.current) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [copilot.messages]);

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
        providerId={providerId}
        onProviderChange={changeProvider}
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
  providerId: ReturnType<typeof useProviderPreference>["providerId"];
  onProviderChange: ReturnType<typeof useProviderPreference>["changeProvider"];
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
  providerId,
  onProviderChange,
}: Readonly<NeosIaSurfaceProps>) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header — shrink-0 so it never compresses. The "Nueva conversación"
          button sits on its OWN row below the description (not inline with
          it), so it doesn't compete with the description for horizontal
          space when the title + selector are already wide. */}
      <header className="flex shrink-0 flex-col gap-2 pb-3">
        <PageHeader
          title="Neos IA"
          action={
            <ProviderSelector
              value={providerId}
              onChange={onProviderChange}
              exhaustedProviders={copilot.exhaustedProviders}
            />
          }
        />

        <p
          className={cn(
            "text-muted-foreground min-w-0 text-pretty text-sm sm:text-base",
            hasMessages && "truncate",
          )}
        >
          {hasMessages
            ? "Conversación activa. Cuéntame cómo continúas."
            : "Tu copiloto para reportar horas en lenguaje natural."}
        </p>

        {hasMessages ? (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copilot.clearConversation}
              className="shrink-0"
            >
              <MessageSquarePlus className="size-4" aria-hidden />
              <span>Nueva conversación</span>
            </Button>
          </div>
        ) : null}
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
