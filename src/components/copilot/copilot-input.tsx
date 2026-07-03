"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowUp, Loader2, Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTextareaAutosize } from "@/hooks/use-textarea-autosize";
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
  onRegisterTextarea?: (node: HTMLTextAreaElement | null) => void;
};

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
  const textareaNodeRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    ref: textareaRefCallback,
    onChange: handleTextareaChange,
    onInput: handleTextareaInput,
  } = useTextareaAutosize(
    {
      minHeight: 44,
      maxHeight: 208,
      onMount: (node) => {
        textareaNodeRef.current = node;
        onRegisterTextarea?.(node);
      },
    },
    (e) => onChange(e.target.value),
  );

  const appendTranscript = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      const sep = value && !/\s$/.test(value) ? " " : "";
      onChange(value + sep + chunk);
    },
    [value, onChange],
  );

  const speech = useSpeechRecognition({
    onFinalTranscript: appendTranscript,
    onEnd: undefined,
  });

  useEffect(() => {
    if (isDisabled && speech.isListening) {
      speech.stop();
    }
  }, [isDisabled, speech]);

  const canSubmit = !isDisabled && value.trim().length > 0;
  const hasLineBreak = value.includes("\n");
  const useExpandedLayout = canSubmit && hasLineBreak;
  const toggleListening = speech.isListening ? speech.stop : speech.start;

  return (
    <div
      data-composer-surface="true"
      className={cn(
        "bg-card relative items-center grid w-full cursor-text overflow-hidden rounded-xl pt-1 pb-2 pl-2 pr-2 shadow-xs/10 motion-safe:transition-colors",
        useExpandedLayout
          ? "grid-rows-[1fr_auto] gap-1"
          : "grid-cols-[1fr_auto] items-center gap-1",
      )}
      style={{
        borderRadius: "28px",
        gridTemplateAreas: useExpandedLayout
          ? "'textarea' 'actions'"
          : "'primary trailing'",
      }}
    >
      <textarea
        ref={textareaRefCallback}
        value={value}
        onChange={handleTextareaChange}
        onInput={handleTextareaInput}
        placeholder={placeholder ?? "¿Qué hiciste hoy?"}
        rows={1}
        maxLength={2000}
        disabled={isDisabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }
        }}
        style={{
          gridArea: useExpandedLayout ? "textarea" : "primary",
        }}
        className={cn(
          TEXTAREA_BASE_CLASSES,
          speech.isListening && "placeholder:text-transparent",
        )}
      />
      {speech.isListening ? <ListeningOverlay /> : null}

      {speech.isListening || canSubmit || speech.isSupported ? (
        <div
          style={{ gridArea: useExpandedLayout ? "actions" : "trailing" }}
          className={cn(
            "flex items-end gap-1",
            useExpandedLayout && "justify-end",
          )}
        >
          {speech.isListening ? (
            <MicButton
              isListening
              isDisabled={isDisabled}
              onToggle={toggleListening}
            />
          ) : canSubmit ? (
            <SendButton loading={loading} onSubmit={onSubmit} />
          ) : (
            <MicButton
              isListening={false}
              isDisabled={isDisabled}
              onToggle={toggleListening}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

const TEXTAREA_BASE_CLASSES = cn(
  "neosia-chat-input block w-full resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-relaxed shadow-none outline-none focus:outline-none focus-visible:border-0 focus-visible:ring-0 [field-sizing:fixed] [&::placeholder]:whitespace-nowrap [&::placeholder]:overflow-hidden [&::placeholder]:text-ellipsis",
);

function ListeningOverlay() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-y-0 left-4 flex items-center"
        aria-hidden
      >
        <VoiceSpectrum />
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Escuchando. Habla ahora.
      </span>
    </>
  );
}

type MicButtonProps = {
  isListening: boolean;
  isDisabled: boolean;
  onToggle: () => void;
};

function MicButton({ isListening, isDisabled, onToggle }: Readonly<MicButtonProps>) {
  const label = isListening ? "Detener dictado" : "Iniciar dictado por voz";
  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "ghost"}
      size="icon"
      onClick={onToggle}
      disabled={isDisabled && !isListening}
      aria-pressed={isListening}
      aria-label={label}
      title={label}
      className={cn(
        "text-muted-foreground hover:text-foreground size-9 rounded-full motion-safe:transition-colors",
        isListening && "motion-safe:animate-pulse",
      )}
    >
      {isListening ? (
        <MicOff className="size-4" aria-hidden />
      ) : (
        <Mic className="size-4" aria-hidden />
      )}
    </Button>
  );
}

type SendButtonProps = {
  loading: boolean;
  onSubmit: () => void;
};

function SendButton({ loading, onSubmit }: Readonly<SendButtonProps>) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onSubmit}
      disabled={loading}
      aria-label="Enviar mensaje"
      title="Enviar mensaje (Enter)"
      className={cn(
        "bg-foreground text-background hover:bg-foreground/90 size-7 rounded-full transition-opacity",
        "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <ArrowUp className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}
