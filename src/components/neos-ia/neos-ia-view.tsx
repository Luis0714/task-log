"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const pinnedRef = useRef(true);
  const hasMessages = copilot.messages.length > 0;

  // Track "pinned to bottom" via window scroll. Unpins when user scrolls up,
  // re-pins when they return within 80px of the bottom.
  useEffect(() => {
    const onScroll = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      pinnedRef.current = distanceFromBottom < 80;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Force-pin when the user submits so they always see the response arrive.
  useEffect(() => {
    if (copilot.loadingPreview) {
      pinnedRef.current = true;
    }
  }, [copilot.loadingPreview]);

  // Auto-scroll on every message change (push AND replace), not just length.
  // Covers: user message added, thinking indicator added/updated, thinking
  // replaced by assistant reply, preview card added.
  useEffect(() => {
    if (!pinnedRef.current) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [copilot.messages]);

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
  sprintContext,
  adoExecutionReady,
  authMethod,
  userInitials,
  providerId,
  onProviderChange,
}: Readonly<NeosIaSurfaceProps>) {
  return (
    <div className="flex w-full flex-col">
      {/*
        Sticky header — breaks out of AppShell's p-4/md:p-6 with negative
        margins so the background covers the full width, then re-applies
        matching horizontal padding so content stays aligned.
        top-14 on mobile clears the AppShell mobile nav (h-14 = 56px).
      */}
      <header className="sticky top-14 z-10 -mx-4 -mt-4 border-b bg-background px-4 py-3 md:-mx-6 md:-mt-6 md:top-0 md:px-6">
        <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">
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

          {!hasMessages && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Tu copiloto para reportar horas en lenguaje natural.
            </p>
          )}

          {hasMessages && (
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copilot.clearConversation}
              >
                <MessageSquarePlus className="size-4" aria-hidden />
                <span>Nueva conversación</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Message thread or welcome screen. pb-24 ensures the last message
          isn't hidden behind the sticky footer. */}
      <div
        className="mx-auto w-full max-w-3xl pt-4 xl:max-w-4xl"
        aria-live="polite"
        aria-relevant="additions"
      >
        {hasMessages ? (
          <div className="flex flex-col gap-4 pb-24">
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
          <NeosIaWelcomeInner />
        )}
      </div>

      {/*
        Sticky footer — mirrors the header breakout pattern.
        -mb-4/md:-mb-6 cancels AppShell's bottom padding so the footer sits
        flush with the viewport bottom edge.
      */}
      <footer
        role="contentinfo"
        aria-label="Entrada de mensaje de Neos IA"
        className="sticky bottom-0 z-10 -mx-4 -mb-4 border-t bg-background px-4 py-3 md:-mx-6 md:-mb-6 md:px-6"
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
  );
}

function NeosIaWelcomeInner() {
  const { setValue, focusTextarea } = useNeosIaDraft();

  const onPickPrompt = (prompt: string) => {
    setValue(prompt);
    requestAnimationFrame(() => focusTextarea());
  };

  return <NeosIaWelcome onPickPrompt={onPickPrompt} />;
}
