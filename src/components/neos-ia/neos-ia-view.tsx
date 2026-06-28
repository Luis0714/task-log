"use client";

import { useCallback, useEffect, useRef } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopilotChatMessage } from "@/components/copilot/copilot-chat-message";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { NeosIaWelcome } from "@/components/neos-ia/neos-ia-welcome";
import { PlanSelector } from "@/components/neos-ia/plan-selector";
import { ProviderSelector } from "@/components/neos-ia/provider-selector";
import { QuickActionPills } from "@/components/neos-ia/quick-action-pills";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NeosIaDraftProvider,
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
};

export function NeosIaView({
  adoExecutionReady,
  authMethod,
  sprintContext,
}: Readonly<NeosIaViewProps>) {
  return (
    <NeosIaViewInner
      adoExecutionReady={adoExecutionReady}
      authMethod={authMethod}
      sprintContext={sprintContext}
    />
  );
}

function NeosIaViewInner({
  adoExecutionReady,
  authMethod,
  sprintContext,
}: Readonly<NeosIaViewProps>) {
  const { appendEntry } = useCopilotHistory();
  const { providerId, changeProvider } = useProviderPreference();
  const copilot = useCopilot({
    appendHistory: appendEntry,
    sprintContext,
    providerId,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const hasMessages = copilot.messages.length > 0;

  /**
   * Track "pinned to bottom" via the internal scroller (not `window`). We
   * unpin whenever the user scrolls more than ~80 px above the bottom so
   * they can review history without being yanked back. Re-pin when a new
   * response starts streaming — handled in the next effect.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      pinnedRef.current = distanceFromBottom < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Force-pin when the user submits so they always see the response arrive,
  // even if they had scrolled up before submitting.
  useEffect(() => {
    if (copilot.loadingPreview) {
      pinnedRef.current = true;
    }
  }, [copilot.loadingPreview]);

  // Auto-scroll on every message change while pinned. We touch the internal
  // scroller's `scrollTop`, not the window, so the header/footer stay put.
  useEffect(() => {
    if (!pinnedRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [copilot.messages]);

  // After a "Nueva conversación" we should re-pin for the next response.
  useEffect(() => {
    if (!hasMessages) {
      pinnedRef.current = true;
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [hasMessages]);

  const setDraft = useCallback(
    (next: string) => copilot.setMessage(next),
    [copilot],
  );

  return (
    <NeosIaDraftProvider value={copilot.message} setValue={setDraft}>
      <NeosIaSurface
        copilot={copilot}
        hasMessages={hasMessages}
        scrollRef={scrollRef}
        sprintContext={sprintContext}
        adoExecutionReady={adoExecutionReady}
        authMethod={authMethod}
        providerId={providerId}
        onProviderChange={changeProvider}
      />
    </NeosIaDraftProvider>
  );
}

type NeosIaSurfaceProps = {
  copilot: ReturnType<typeof useCopilot>;
  hasMessages: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  sprintContext?: SprintContext;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  providerId: ReturnType<typeof useProviderPreference>["providerId"];
  onProviderChange: ReturnType<typeof useProviderPreference>["changeProvider"];
};

const CONTENT_MAX_W = "max-w-3xl";

function NeosIaSurface({
  copilot,
  hasMessages,
  scrollRef,
  sprintContext,
  adoExecutionReady,
  authMethod,
  providerId,
  onProviderChange,
}: Readonly<NeosIaSurfaceProps>) {
  const copilotInputProps = {
    value: copilot.message,
    onChange: copilot.setMessage,
    onSubmit: () => copilot.interpret(),
    loading: copilot.loadingPreview,
    placeholder: hasMessages
      ? "Continúa o añade más detalles…"
      : "¿Qué hiciste hoy?",
  };

  return (
    /*
     * Layout flex-column que vive dentro del `SidebarInset` del AppShell:
     *  - Header y footer usan `sticky` (no `fixed`), así no se montan
     *    encima del sidebar en desktop ni del header móvil del AppShell
     *    (que ya contiene el `SidebarTrigger` para abrir el sidebar).
     *  - El scroll ocurre en `<main>` (`flex-1 min-h-0`), dejando header
     *    y footer anclados a los bordes del `SidebarInset`.
     */
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="bg-background/95 sticky top-0 z-20 h-16 shrink-0 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div
          className={cn(
            "mx-auto flex h-full w-full items-center justify-between gap-3 px-4",
            CONTENT_MAX_W,
          )}
        >
          <div className="flex items-center gap-2">
            <PlanSelector />
            <Tooltip>
              <TooltipTrigger
                render={(triggerProps) => (
                  <Button
                    {...triggerProps}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copilot.clearConversation}
                    aria-label="Nueva conversación"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquarePlus className="size-4" aria-hidden />
                    <span className="hidden sm:inline">
                      Nueva conversación
                    </span>
                  </Button>
                )}
              />
              <TooltipContent>Nueva conversación</TooltipContent>
            </Tooltip>
          </div>
          <ProviderSelector
            value={providerId}
            onChange={onProviderChange}
            exhaustedProviders={copilot.exhaustedProviders}
          />
        </div>
      </header>

      {hasMessages ? (
        <MessagesLayout
          scrollRef={scrollRef}
          messages={copilot.messages}
          sprintContext={sprintContext}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loadingExecute={copilot.loadingExecute}
          onConfirmTasks={copilot.executeCreateTasks}
          onConfirmLogWork={copilot.execute}
          onPickPbi={copilot.submitPbiId}
          onPickOption={copilot.submitOptionValue}
          onCancel={copilot.dismissPreview}
        />
      ) : (
        <EmptyStateLayout copilotInputProps={copilotInputProps} />
      )}

      {hasMessages ? (
        <footer
          role="contentinfo"
          aria-label="Entrada de mensaje de Neos IA"
          className="bg-background/95 sticky bottom-0 z-20 shrink-0 pb-4 pt-3 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:pb-6 sm:pt-4"
        >
          <div className={cn("mx-auto w-full px-4", CONTENT_MAX_W)}>
            <CopilotInput {...copilotInputProps} />
          </div>
        </footer>
      ) : null}
    </div>
  );
}

type MessagesLayoutProps = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: ReturnType<typeof useCopilot>["messages"];
  sprintContext?: SprintContext;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loadingExecute: boolean;
  onConfirmTasks: ReturnType<typeof useCopilot>["executeCreateTasks"];
  onConfirmLogWork: ReturnType<typeof useCopilot>["execute"];
  onPickPbi: ReturnType<typeof useCopilot>["submitPbiId"];
  onPickOption: ReturnType<typeof useCopilot>["submitOptionValue"];
  onCancel: ReturnType<typeof useCopilot>["dismissPreview"];
};

function MessagesLayout({
  scrollRef,
  messages,
  sprintContext,
  adoExecutionReady,
  authMethod,
  loadingExecute,
  onConfirmTasks,
  onConfirmLogWork,
  onPickPbi,
  onPickOption,
  onCancel,
}: Readonly<MessagesLayoutProps>) {
  return (
    <main
      ref={scrollRef}
      className="thin-scrollbar min-h-0 flex-1 overflow-y-auto"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col px-4 pt-4 pb-32 sm:pt-6",
          CONTENT_MAX_W,
        )}
      >
        <div className="flex flex-col gap-6 sm:gap-8">
          {messages.map((msg) => (
            <CopilotChatMessage
              key={msg.id}
              msg={msg}
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
          ))}
        </div>
      </div>
    </main>
  );
}

type EmptyStateLayoutProps = {
  copilotInputProps: React.ComponentProps<typeof CopilotInput>;
};

function EmptyStateLayout({ copilotInputProps }: Readonly<EmptyStateLayoutProps>) {
  const { onChange } = copilotInputProps;
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handlePickPrompt = useCallback(
    (prompt: string) => {
      onChange(prompt);
      composerTextareaRef.current?.focus();
    },
    [onChange],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-6">
      <div
        className={cn(
          "flex w-full flex-col items-center gap-6",
          CONTENT_MAX_W,
        )}
      >
        <NeosIaWelcome />
        <CopilotInput
          {...copilotInputProps}
          onRegisterTextarea={(node) => {
            composerTextareaRef.current = node;
          }}
        />
        <QuickActionPills onPick={handlePickPrompt} />
      </div>
    </div>
  );
}
