"use client";

import { useEffect, useRef, useState } from "react";
import { Radio as RadioGroup } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Circle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { QuestionWithOptionsPayload } from "@/lib/schemas/agent";

export type CopilotOptionsCardProps = {
  messageId: string;
  payload: QuestionWithOptionsPayload;
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export function CopilotOptionsCard({
  messageId,
  payload,
  onSubmit,
  disabled = false,
}: Readonly<CopilotOptionsCardProps>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedText = freeText.trim();
  const canSubmit = !disabled && (!!selectedId || !!trimmedText);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (trimmedText) {
      onSubmit(trimmedText);
    } else if (selectedId) {
      const opt = payload.options.find((o) => o.id === selectedId);
      onSubmit(opt?.value ?? selectedId);
    }
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isInInput = active?.dataset.slot === "input";

      if (isInInput) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const idx = Number.parseInt(e.key, 10) - 1;
        const opt = payload.options[idx];
        if (opt && !disabled) {
          e.preventDefault();
          setSelectedId(opt.id);
          setFreeText("");
        }
      } else if (e.key === "Enter" && canSubmit) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedId(null);
        setFreeText("");
      }
    };

    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.options, selectedId, freeText, onSubmit, disabled, canSubmit]);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby={`${messageId}-question`}
      className="bg-card text-card-foreground flex flex-col gap-3 rounded-lg border p-4 shadow-sm"
    >
      <h3
        id={`${messageId}-question`}
        className="text-sm font-medium leading-relaxed"
      >
        {payload.question}
      </h3>

      <BaseRadioGroup
        value={selectedId ?? ""}
        onValueChange={(v) => {
          setSelectedId(v);
          setFreeText("");
        }}
        disabled={disabled}
        aria-label={payload.question}
        className="flex flex-col gap-2"
      >
        {payload.options.map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          return (
            <label
              key={opt.id}
              htmlFor={`${messageId}-${opt.id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                "hover:bg-muted/50",
                "has-data-checked:border-primary has-data-checked:bg-primary/5",
                isSelected && "border-primary bg-primary/5",
              )}
            >
              <RadioGroup.Root
                value={opt.id}
                id={`${messageId}-${opt.id}`}
                className="relative mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50"
              >
                <RadioGroup.Indicator
                  className="flex size-full items-center justify-center"
                  keepMounted
                >
                  <Circle className="size-2 fill-primary text-primary" />
                </RadioGroup.Indicator>
              </RadioGroup.Root>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-snug">
                  <span className="text-muted-foreground mr-2 font-mono text-xs tabular-nums">
                    {idx + 1}
                  </span>
                  {opt.label}
                </span>
                {opt.description ? (
                  <span className="text-muted-foreground text-xs leading-snug">
                    {opt.description}
                  </span>
                ) : null}
              </div>
            </label>
          );
        })}
      </BaseRadioGroup>

      <div className="flex items-center gap-2 pt-1">
        {payload.allowFreeText && (
          <Input
            data-slot="input"
            type="text"
            placeholder="O escribe tu respuesta..."
            value={freeText}
            onChange={(e) => {
              setFreeText(e.target.value);
              if (e.target.value) setSelectedId(null);
            }}
            disabled={disabled}
            className="h-8 flex-1 text-sm"
          />
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn("gap-1.5", !payload.allowFreeText && "ml-auto")}
        >
          <Send className="size-4" aria-hidden />
          Enviar
        </Button>
      </div>
    </section>
  );
}
