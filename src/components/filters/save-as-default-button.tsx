"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type SaveAsDefaultButtonProps = Readonly<{
  onSave: () => Promise<void> | void;
  /** Texto cuando el botón está en estado idle. */
  label?: string;
  /** Deshabilita el botón (p. ej. cuando no hay selección válida). */
  disabled?: boolean;
  className?: string;
}>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVED_FEEDBACK_MS = 2000;
const ERROR_FEEDBACK_MS = 3000;
const DEFAULT_LABEL = "Establecer como predeterminado";

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado ✓",
  error: "No se pudo guardar",
};

type UseSaveFeedbackResult = {
  isDisabled: boolean;
  labelText: string;
  trigger: () => Promise<void>;
};

function useSaveFeedback(label: string, disabled: boolean): UseSaveFeedbackResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const scheduleStatusReset = useCallback((delayMs: number) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, delayMs);
  }, []);

  const trigger = useCallback(async () => {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await Promise.resolve();
      setStatus("saved");
      scheduleStatusReset(SAVED_FEEDBACK_MS);
    } catch (cause) {
      appToast.error("No se pudieron guardar los valores predeterminados.", {
        description:
          cause instanceof Error ? cause.message : "Error desconocido.",
      });
      setStatus("error");
      scheduleStatusReset(ERROR_FEEDBACK_MS);
    }
  }, [scheduleStatusReset, status]);

  const statusLabel = STATUS_LABEL[status];
  const labelText = statusLabel || label;

  return {
    isDisabled: disabled || status === "saving",
    labelText,
    trigger,
  };
}

/** Variante "outline / sm": ejecuta `onSave` directamente. */
export function SaveAsDefaultButton({
  onSave,
  label = DEFAULT_LABEL,
  disabled = false,
  className,
}: SaveAsDefaultButtonProps) {
  const { isDisabled, labelText, trigger } = useSaveFeedback(label, disabled);

  async function handleClick() {
    try {
      await onSave();
      await trigger();
    } catch (cause) {
      appToast.error("No se pudieron guardar los valores predeterminados.", {
        description:
          cause instanceof Error ? cause.message : "Error desconocido.",
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={isDisabled}
      aria-live="polite"
      className={className}
    >
      {labelText}
    </Button>
  );
}

/** Variante visual "enlace pequeño" — misma semántica. */
export function SaveAsDefaultLinkButton({
  onSave,
  label = DEFAULT_LABEL,
  disabled = false,
  className,
}: SaveAsDefaultButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await onSave();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "text-primary inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 transition-colors",
        "hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled || pending}
      onClick={() => void handleClick()}
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {label}
        </>
      ) : (
        label
      )}
    </button>
  );
}

