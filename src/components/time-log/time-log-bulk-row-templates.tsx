"use client";

import { Pencil, X } from "lucide-react";

import { SaveAsTemplateDialog } from "@/components/time-log/save-as-template-dialog";
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
  /** Mensaje de error si la carga de plantillas falló. */
  error?: string | null;
  /** Plantilla actualmente seleccionada (necesaria para el modo edición). */
  selectedTemplate: TimeLogTemplateDto | null;
  /** Valores por defecto para abrir el diálogo "Editar plantilla". */
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity: string;
  defaultHours: string;
  activities: readonly string[];
  onSelect: (template: TimeLogTemplateDto) => void;
  onClear: () => void;
}>;

/**
 * Lista horizontal de cards de plantillas para usar dentro de una tarea del
 * modo Múltiple. Reutiliza el visual y los badges del modo Individual vía
 * `template-card.tsx`.
 *
 * Ofrece "Quitar plantilla" y "Editar plantilla" cuando hay una plantilla
 * seleccionada. El botón "+" para crear una plantilla nueva vive en la
 * cabecera de la tarea (al lado del título "Plantillas"), igual que en el
 * modo Individual.
 */
export function TimeLogBulkRowTemplates({
  templates,
  selectedId,
  disabled = false,
  loading = false,
  error = null,
  selectedTemplate,
  defaultTitle,
  defaultDescription,
  defaultActivity,
  defaultHours,
  activities,
  onSelect,
  onClear,
}: TimeLogBulkRowTemplatesProps) {
  if (loading && templates.length === 0) {
    return <TemplatesSkeleton />;
  }

  if (templates.length === 0) {
    const message = error
      ? `No pudimos cargar las plantillas: ${error}.`
      : 'No hay plantillas disponibles. Usa el botón "+" para crear una nueva.';
    return (
      <p className="text-muted-foreground text-xs">{message}</p>
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
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-3" aria-hidden />
            Quitar plantilla
          </button>
          {selectedTemplate && !selectedTemplate.isSystem ? (
            <SaveAsTemplateDialog
              mode="edit"
              templateId={selectedTemplate.id}
              defaultName={selectedTemplate.name}
              defaultTitle={defaultTitle}
              defaultDescription={defaultDescription}
              defaultActivity={defaultActivity}
              defaultHours={defaultHours}
              activities={activities}
              disabled={disabled}
            >
              <Pencil className="size-3" aria-hidden />
              Editar plantilla
            </SaveAsTemplateDialog>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
