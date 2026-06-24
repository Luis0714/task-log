"use client";

import { X } from "lucide-react";

import {
  TemplateCard,
  TemplatesSkeleton,
} from "@/components/time-log/template-card";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

export type TimeLogBulkRowTemplatesProps = Readonly<{
  templates: readonly TimeLogTemplateDto[];
  selectedId: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (template: TimeLogTemplateDto) => void;
  onClear: () => void;
}>;

/**
 * Lista horizontal de cards de plantillas para usar dentro de una fila del
 * modo Múltiple. Reutiliza el visual y los badges del modo Individual vía
 * `template-card.tsx`.
 */
export function TimeLogBulkRowTemplates({
  templates,
  selectedId,
  disabled = false,
  loading = false,
  onSelect,
  onClear,
}: TimeLogBulkRowTemplatesProps) {
  if (loading && templates.length === 0) {
    return <TemplatesSkeleton />;
  }

  if (templates.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No hay plantillas disponibles. Crea una desde el modo Individual y luego
        podrás aplicarla aquí.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            onSelect={() => onSelect(template)}
            onClear={onClear}
            disabled={disabled}
          />
        ))}
      </div>
      {selectedId ? (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-3" aria-hidden />
          Quitar plantilla
        </button>
      ) : null}
    </div>
  );
}
