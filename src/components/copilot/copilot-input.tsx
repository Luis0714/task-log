"use client";

import { useEffect } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { computeCanSubmit } from "@/lib/forms/can-submit";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

export type CopilotInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function CopilotInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
}: Readonly<CopilotInputProps>) {
  const isDisabled = disabled || loading;
  const canSubmit = computeCanSubmit({
    isValid: value.trim().length > 0,
    externalReady: !disabled,
    isSubmitting: loading,
  });

  const appendTranscript = (chunk: string) => {
    if (!chunk) return;
    const sep = value && !/\s$/.test(value) ? " " : "";
    onChange(value + sep + chunk);
  };

  const speech = useSpeechRecognition({ onFinalTranscript: appendTranscript });

  useEffect(() => {
    if (loading) speech.stop();
  }, [loading, speech]);

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Ej: "Trabajé 2 horas en la US-123 corrigiendo el login"'
        rows={4}
        className="min-h-24 resize-none text-base md:text-sm"
        disabled={isDisabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {speech.isSupported && (
            <Button
              type="button"
              variant={speech.isListening ? "destructive" : "outline"}
              onClick={speech.isListening ? speech.stop : speech.start}
              disabled={isDisabled}
              aria-pressed={speech.isListening}
              aria-label={
                speech.isListening ? "Detener dictado" : "Iniciar dictado por voz"
              }
              className={cn("min-h-10", speech.isListening && "animate-pulse")}
            >
              {speech.isListening ? (
                <MicOff className="size-4" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {speech.isListening ? "Detener" : "Hablar"}
              </span>
            </Button>
          )}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="min-h-10 flex-1 sm:flex-none"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Interpretar
          </Button>
        </div>
        <span className="text-muted-foreground hidden text-xs sm:inline">Ctrl+Enter</span>
      </div>
      {speech.isListening && (
        <p
          className="text-muted-foreground text-xs"
          role="status"
          aria-live="polite"
        >
          Escuchando… habla ahora.
        </p>
      )}
    </div>
  );
}
