"use client";

import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { computeCanSubmit } from "@/lib/forms/can-submit";

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
}: CopilotInputProps) {
  const isDisabled = disabled || loading;
  const canSubmit = computeCanSubmit({
    isValid: value.trim().length > 0,
    externalReady: !disabled,
    isSubmitting: loading,
  });

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
      <div className="flex items-center justify-between gap-2">
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
        <span className="text-muted-foreground hidden text-xs sm:inline">Ctrl+Enter</span>
      </div>
    </div>
  );
}
