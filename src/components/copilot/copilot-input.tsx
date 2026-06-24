"use client";

import { useCallback, useEffect, useRef } from "react";
import { Info, Loader2, Mic, MicOff, Send } from "lucide-react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { useAutoSendVoicePreference } from "@/hooks/use-auto-send-voice";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { VoiceSpectrum } from "@/components/copilot/voice-spectrum";
import { cn } from "@/lib/utils";

export type CopilotInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Called by the parent when the textarea should register itself (so the
   * welcome-screen suggestion chips can focus it after pre-filling).
   */
  onRegisterTextarea?: (node: HTMLTextAreaElement | null) => void;
};

/**
 * Footer input for Neos IA:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [ⓘ]   <textarea auto-grow>                       [🎤][📤]│
 *   └─────────────────────────────────────────────────────────┘
 *
 * The (ⓘ) info button opens an upward dropdown that surfaces:
 *   - keyboard shortcuts (Enter to send, Shift+Enter for newline)
 *   - the auto-send voice preference switch
 *
 * Keeping these discoverable but out of the way keeps the input bar visually
 * minimal and focused on writing.
 */
export function CopilotInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder,
  onRegisterTextarea,
}: Readonly<CopilotInputProps>) {
  const isDisabled = disabled || loading;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { autoSend, setAutoSend } = useAutoSendVoicePreference();

  const appendTranscript = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      const sep = value && !/\s$/.test(value) ? " " : "";
      onChange(value + sep + chunk);
    },
    [value, onChange],
  );

  const handleSpeechEnd = useCallback(() => {
    if (autoSend && value.trim().length > 0 && !isDisabled) {
      onSubmit();
    }
  }, [autoSend, value, isDisabled, onSubmit]);

  const speech = useSpeechRecognition({
    onFinalTranscript: appendTranscript,
    onEnd: handleSpeechEnd,
  });

  useEffect(() => {
    if (loading) speech.stop();
  }, [loading, speech]);

  useEffect(() => {
    onRegisterTextarea?.(textareaRef.current);
    return () => onRegisterTextarea?.(null);
  }, [onRegisterTextarea]);

  useEffect(() => {
    if (isDisabled && speech.isListening) {
      speech.stop();
    }
  }, [isDisabled, speech]);

  const canSubmit = !isDisabled && value.trim().length > 0;
  const toggleListening = speech.isListening ? speech.stop : speech.start;

  return (
    <div className="bg-background flex flex-col gap-2">
      <div className="flex items-end gap-2">
        {/* Info button — opens an upward dropdown with shortcuts + settings */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(triggerProps) => (
              <Button
                {...triggerProps}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Atajos y opciones de voz"
                title="Atajos y opciones"
                className="text-muted-foreground hover:text-foreground size-9 shrink-0"
              >
                <Info className="size-4" aria-hidden />
              </Button>
            )}
          />
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-72"
          >
            <DropdownMenuLabel>Atajos de teclado</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem disabled className="justify-between">
                <span>Interpretar</span>
                <Kbd>Enter</Kbd>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="justify-between">
                <span>Nueva línea</span>
                <span className="flex items-center gap-1">
                  <Kbd>Mayús</Kbd>
                  <span>+</span>
                  <Kbd>Enter</Kbd>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Voz</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="justify-between"
            >
              <span className="text-pretty">Enviar al dejar de dictar</span>
              <BaseSwitch.Root
                checked={autoSend}
                onCheckedChange={(checked: boolean) => setAutoSend(checked)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-input bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-checked:border-primary data-checked:bg-primary"
              >
                <BaseSwitch.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-[18px]" />
              </BaseSwitch.Root>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Center zone: auto-growing textarea wrapped in a relative container
            so we can overlay the voice spectrum inside it while dictating.
            `min-w-0` lets the flex item shrink below its intrinsic content
            width — without it the placeholder string pushes the mic/send
            buttons off-screen. */}
        <div className="relative min-w-0 flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              placeholder ??
              'Escribe o pulsa el micro para dictar — Ej: "Hoy trabajé 2h en HU-102 y 1h en HU-105"'
            }
            rows={1}
            maxLength={2000}
            disabled={isDisabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            className={cn(
              "min-h-10 min-w-0 w-full resize-none px-3 py-2 text-sm",
              // Input stays at a fixed height — text that overflows is
              // ellipsized on a single line instead of growing the textarea
              // and pushing the layout on mobile.
              "whitespace-nowrap overflow-hidden text-ellipsis",
              // While listening, hide the placeholder text so only the
              // voice spectrum is visible inside the input.
              speech.isListening && "placeholder:text-transparent",
            )}
          />
          {speech.isListening ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
              aria-hidden
            >
              <VoiceSpectrum />
            </div>
          ) : null}
          {speech.isListening ? (
            <span className="sr-only" role="status" aria-live="polite">
              Escuchando. Habla ahora.
            </span>
          ) : null}
        </div>

        {/* Right zone: mic + send buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          {speech.isSupported ? (
            <Button
              type="button"
              variant={speech.isListening ? "destructive" : "ghost"}
              size="icon"
              onClick={toggleListening}
              disabled={isDisabled && !speech.isListening}
              aria-pressed={speech.isListening}
              aria-label={speech.isListening ? "Detener dictado" : "Iniciar dictado por voz"}
              title={speech.isListening ? "Detener dictado" : "Iniciar dictado por voz"}
              className={cn(
                "size-9 motion-safe:transition-colors",
                speech.isListening && "motion-safe:animate-pulse",
              )}
            >
              {speech.isListening ? (
                <MicOff className="size-4" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="Interpretar mensaje"
            title="Interpretar mensaje (Enter)"
            className="size-9"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
