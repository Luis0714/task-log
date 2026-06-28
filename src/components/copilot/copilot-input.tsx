"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowUp, Loader2, Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
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
  /**
   * Called by the parent when the textarea should register itself (so the
   * welcome-screen suggestion chips can focus it after pre-filling).
   */
  onRegisterTextarea?: (node: HTMLTextAreaElement | null) => void;
};

/**
 * Composer flotante de Neos IA — grid de 3 columnas alineado al patrón de
 * ChatGPT:
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │  ⊕            textarea (crece hasta max-h)        🎤 ⬆  │
 *   └───────────────────────────────────────────────────────────┘
 *
 * - Leading: botón `+` (adjuntar / más opciones).
 * - Primary: textarea con auto-grow (min 2 líneas → max ~13 líneas).
 * - Trailing: micrófono + enviar.
 *
 * La superficie entera tiene `cursor-text` para que cualquier click dentro
 * enfoque el textarea, esquinas `border-radius: 28px` (inline para que la
 * sombra envuelva correctamente) y `shadow-short-composer` ≈ `shadow-xs/30`.
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
  const textareaNodeRef = useRef<HTMLTextAreaElement | null>(null);

  // El hook maneja el ref + el auto-grow. `onMount` recibe el nodo y lo
  // publica al padre (`NeosIaView`) para que las quick actions puedan
  // enfocar el textarea al hacer click. También lo capturamos localmente
  // para devolver el foco desde el botón del isotipo Neos.
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

  // Detener dictado cuando empieza a streamear o se desactiva.
  useEffect(() => {
    if (isDisabled && speech.isListening) {
      speech.stop();
    }
  }, [isDisabled, speech]);

  const canSubmit = !isDisabled && value.trim().length > 0;
  const toggleListening = speech.isListening ? speech.stop : speech.start;

  return (
    <div
      data-composer-surface="true"
      className={cn(
        // Surface unificado tipo ChatGPT — el `bg-card` aplica al composer
        // completo, y el textarea es `bg-transparent` para que se vea la
        // misma superficie. El color de fondo es igual en textarea e iconos
        // porque ambos viven sobre el mismo `bg-card`.
        //
        // Layout cambia según el estado (computed abajo):
        //  - Empty: 1 fila horizontal [Neos | textarea | mic/send] centrada.
        //  - Typing: 2 filas [textarea / actions] — textarea crece
        //    hacia abajo y los iconos se mueven al bottom del composer.
        "bg-card grid w-full cursor-text overflow-hidden rounded-3xl p-2 shadow-xs/10 motion-safe:transition-colors",
        canSubmit
          ? "grid-rows-[1fr_auto] gap-1"
          : "grid-cols-[auto_1fr_auto] items-end gap-1",
      )}
      style={{
        borderRadius: "28px",
        gridTemplateAreas: canSubmit
          ? "'textarea' 'actions'"
          : "'leading primary trailing'",
      }}
    >
      {/* Primary: textarea con auto-grow. `bg-transparent` para heredar
          el `bg-card` del composer. El `gridArea` cambia entre "primary"
          (fila única, empty) y "textarea" (primera fila, typing). */}
      <Textarea
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
          gridArea: canSubmit ? "textarea" : "primary",
        }}
        className={cn(
          TEXTAREA_BASE_CLASSES,
          // Mientras escucha, oculta el placeholder para que solo se vea el
          // espectro de voz dentro del input.
          speech.isListening && "placeholder:text-transparent",
        )}
      />
      {speech.isListening ? <ListeningOverlay /> : null}

      {canSubmit ? (
        // Estado escribiendo: fila inferior con [Neos] a la izquierda
        // y [mic/send] a la derecha. Ambos comparten el grid area "actions".
        <div
          style={{ gridArea: "actions" }}
          className="flex items-center justify-between"
        >
          <button
            type="button"
            aria-label="Neos IA — enfocar el composer"
            title="Neos IA"
            onClick={() => textareaNodeRef.current?.focus()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <span
              aria-hidden
              className="bg-brand-mark/15 text-brand-mark inline-flex size-7 items-center justify-center rounded-md"
            >
              <NeosViewIsotipoBadge className="size-4" />
            </span>
          </button>
          <div className="flex items-end gap-1">
            {speech.isListening ? (
              <MicButton
                isListening
                isDisabled={isDisabled}
                onToggle={toggleListening}
              />
            ) : (
              <SendButton loading={loading} onSubmit={onSubmit} />
            )}
          </div>
        </div>
      ) : (
        // Estado vacío: una sola fila con [Neos] a la izquierda y
        // [mic] a la derecha del textarea. El textarea ocupa el centro
        // (`flex-1` en su clase base).
        <>
          <button
            type="button"
            aria-label="Neos IA — enfocar el composer"
            title="Neos IA"
            onClick={() => textareaNodeRef.current?.focus()}
            style={{ gridArea: "leading" }}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <span
              aria-hidden
              className="bg-brand-mark/15 text-brand-mark inline-flex size-7 items-center justify-center rounded-md"
            >
              <NeosViewIsotipoBadge className="size-4" />
            </span>
          </button>
          <div
            style={{ gridArea: "trailing" }}
            className="ms-auto flex items-end gap-1"
          >
            {speech.isSupported ? (
              <MicButton
                isListening={false}
                isDisabled={isDisabled}
                onToggle={toggleListening}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- subcomponentes extraídos para bajar la complejidad cognitiva ----------

const TEXTAREA_BASE_CLASSES = cn(
  // `[field-sizing:fixed]` desactiva `field-sizing-content` del shadcn Textarea
  // para que no crezca al alto del placeholder en navegadores que lo miden.
  // `bg-transparent` es explícito: el textarea NO tiene surface propio —
  // el `bg-card` del composer se ve a través para que parezca una sola
  // superficie continua.
  // `flex-1` toma el espacio horizontal entre los iconos leading/trailing
  // cuando el composer es flex-row. Las reglas con `[&::placeholder]:`
  // fuerzan el placeholder a una sola línea con ellipsis si no cabe.
  // Sin border — el contenedor padre ya provee la superficie.
  "neosia-chat-input flex-1 resize-none self-center border-0 bg-transparent px-2 py-2 text-sm leading-relaxed shadow-none focus-visible:border-0 focus-visible:ring-0 [field-sizing:fixed] [&::placeholder]:whitespace-nowrap [&::placeholder]:overflow-hidden [&::placeholder]:text-ellipsis",
);

function ListeningOverlay() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-y-0 left-2 flex items-center"
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
        // Botón neutro estilo ChatGPT: bg-foreground invierte el color de
        // texto. En dark mode queda blanco con flecha oscura; en light mode
        // queda oscuro con flecha clara. Sin color brand — el "enviar" es
        // una acción obvia, no promocional.
        "bg-foreground text-background hover:bg-foreground/90 size-9 rounded-full transition-opacity",
        "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <ArrowUp className="size-4" aria-hidden />
      )}
    </Button>
  );
}
