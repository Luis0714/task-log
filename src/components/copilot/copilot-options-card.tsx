"use client";

import { useEffect, useRef, useState } from "react";
import { Radio as RadioGroup } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Circle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { QuestionWithOptionsPayload } from "@/lib/schemas/agent";

export type CopilotOptionsCardProps = {
  messageId: string;
  payload: QuestionWithOptionsPayload;
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

const MULTI_SELECT_SEPARATOR = ",";

/**
 * Deriva un ID numérico desde un `id` kebab-case. El LLM suele usar
 * prefijos como `wi-258439`, `hu-105`, `bug-45`, `task-200`. Si el
 * sufijo es numérico, lo devolvemos tal cual — así el siguiente turno
 * del agente recibe un ID limpio que puede matchear directamente con
 * los items que ya tiene en contexto (de get_my_work_items / search_pbi)
 * sin necesidad de re-consultar ADO.
 *
 * Si el `id` no encaja con el patrón `<prefijo>-<número>`, devolvemos
 * el `id` tal cual para no perder información.
 */
function deriveNumericId(id: string): string {
  const match = /^[a-z]+-(\d+)$/i.exec(id);
  return match?.[1] ?? id;
}

export function CopilotOptionsCard({
  messageId,
  payload,
  onSubmit,
  disabled = false,
}: Readonly<CopilotOptionsCardProps>) {
  const isMulti = payload.multiSelect;
  // Single-select: tracked as a single id (or null). Multi-select: tracked
  // as a Set so toggling individual options is O(1). We branch on
  // `payload.multiSelect` at render time and choose between the two shapes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [freeText, setFreeText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedText = freeText.trim();
  const hasSelection = isMulti ? selectedIds.size > 0 : !!selectedId;
  const canSubmit = !disabled && (hasSelection || !!trimmedText);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (trimmedText) {
      onSubmit(trimmedText);
      return;
    }
    if (isMulti) {
      // Concatenamos los `value`s de cada opción seleccionada con coma.
      // El LLM recibe el string y debe hacer split(",") para parsear.
      // Ej: "123,124,125" si el usuario marcó 3 work items.
      // Si el LLM no pasó `value`, derivamos uno limpio desde el `id`
      // (típicamente viene como "wi-258439" → "258439"), para que el
      // siguiente turno reciba el ID numérico y NO tenga que re-buscar
      // en ADO (los items ya están en su contexto de get_my_work_items).
      const values = payload.options
        .filter((o) => selectedIds.has(o.id))
        .map((o) => o.value ?? deriveNumericId(o.id));
      onSubmit(values.join(MULTI_SELECT_SEPARATOR));
      return;
    }
    const opt = payload.options.find((o) => selectedId === o.id);
    onSubmit(opt?.value ?? (selectedId ? deriveNumericId(selectedId) : ""));
  };

  const toggleSelectedId = (id: string) => {
    if (isMulti) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setFreeText("");
      return;
    }
    setSelectedId(id);
    setFreeText("");
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
          toggleSelectedId(opt.id);
        }
      } else if (e.key === "Enter" && canSubmit) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (isMulti) setSelectedIds(new Set());
        else setSelectedId(null);
        setFreeText("");
      }
    };

    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.options, selectedId, selectedIds, freeText, onSubmit, disabled, canSubmit, isMulti]);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby={`${messageId}-question`}
      className="space-y-4"
    >
      <h3
        id={`${messageId}-question`}
        className="text-base font-medium leading-relaxed"
      >
        {payload.question}
        {isMulti ? (
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            (puedes seleccionar varios)
          </span>
        ) : null}
      </h3>

      <BaseRadioGroup
        value={isMulti ? "" : selectedId ?? ""}
        onValueChange={(v) => {
          if (!isMulti) {
            setSelectedId(v);
            setFreeText("");
          }
        }}
        disabled={disabled}
        aria-label={payload.question}
        className="flex flex-col gap-1"
      >
        {payload.options.map((opt, idx) => {
          const isChecked = isMulti ? selectedIds.has(opt.id) : selectedId === opt.id;
          return (
            <label
              key={opt.id}
              htmlFor={`${messageId}-${opt.id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 transition-colors",
                "hover:bg-muted/50",
                "has-data-checked:bg-primary/5",
                isChecked && "bg-primary/5",
              )}
            >
              {isMulti ? (
                <Checkbox
                  id={`${messageId}-${opt.id}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleSelectedId(opt.id)}
                  disabled={disabled}
                  className="mt-0.5"
                />
              ) : (
                <RadioGroup.Root
                  value={opt.id}
                  id={`${messageId}-${opt.id}`}
                  className="relative mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50"
                >
                  <RadioGroup.Indicator
                    className="flex size-full items-center justify-center data-unchecked:hidden"
                    keepMounted
                  >
                    <Circle className="size-2 fill-primary text-primary" />
                  </RadioGroup.Indicator>
                </RadioGroup.Root>
              )}
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
        {payload.allowFreeText ? (
          <Input
            data-slot="input"
            type="text"
            placeholder={
              isMulti
                ? "O escribe IDs separados por coma (ej. 123, 124)..."
                : "O escribe tu respuesta..."
            }
            value={freeText}
            onChange={(e) => {
              setFreeText(e.target.value);
              if (e.target.value) {
                if (isMulti) setSelectedIds(new Set());
                else setSelectedId(null);
              }
            }}
            disabled={disabled}
            className="h-9 flex-1 text-sm"
          />
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn("gap-1.5", !payload.allowFreeText && "ml-auto")}
        >
          <Send className="size-4" aria-hidden />
          {isMulti && selectedIds.size > 1
            ? `Enviar (${selectedIds.size})`
            : "Enviar"}
        </Button>
      </div>
    </section>
  );
}
