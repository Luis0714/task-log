"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { TbTemplate } from "react-icons/tb";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTimeLogTemplates } from "@/hooks/use-time-log-templates";
import { useApplyTemplate } from "@/hooks/time-log/use-apply-template";
import { SaveAsTemplateDialog } from "@/components/time-log/save-as-template-dialog";
import { DeleteTemplateDialog } from "@/components/time-log/fields/delete-template-dialog";
import { TemplateCardBadge, badgeForTemplate } from "@/components/time-log/template-card";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TemplateSelectFieldProps = Readonly<{
  form: UseFormReturn<TimeLogFormValues>;
  activities: readonly string[];
  /**
   * Última tarea enviada con éxito desde el formulario Individual. Se
   * reasigna a un objeto nuevo en cada save exitoso y se usa como señal
   * para limpiar la plantilla seleccionada tras el guardado.
   */
  lastSubmitted?: {
    taskTitle: string;
    description: string;
    activity?: string;
    hours?: string;
  } | null;
}>;

type TemplateCardProps = Readonly<{
  template: TimeLogTemplateDto;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
  onDelete: () => Promise<boolean> | boolean;
  activities: readonly string[];
}>;

/**
 * Card visual de plantilla para el modo Individual. Más ancho (w-44) y con
 * botones de editar/eliminar para plantillas personales. Para el listado
 * compacto dentro de una fila del modo Múltiple, ver `TemplateCard` en
 * `template-card.tsx`.
 */
function TemplateCard({
  template,
  selected,
  onSelect,
  onClear,
  onDelete,
  activities,
}: TemplateCardProps) {
  const { label, variant } = badgeForTemplate(template);
  const hasActions = !template.isSystem;

  return (
    <div
      className={cn(
        "flex w-44 shrink-0 flex-col rounded-md border transition",
        "hover:border-primary",
        selected
          ? "border-primary bg-primary/5 ring-primary/30 ring-2"
          : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={selected ? onClear : onSelect}
        aria-pressed={selected}
        aria-label={`${template.name} (${label})`}
        className={cn(
          "flex flex-col items-start gap-0.5 px-2.5 py-1.5 text-left hover:bg-primary/5",
          hasActions ? "rounded-t-md" : "rounded-md",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <span className="truncate text-xs font-medium leading-tight">
            {template.name}
          </span>
          {selected ? (
            <Check className="text-primary size-3 shrink-0" aria-hidden />
          ) : null}
        </div>
        <TemplateCardBadge variant={variant} label={label} />
      </button>

      {hasActions ? (
        <div className="border-border/50 flex items-center justify-between gap-1 border-t px-1.5 py-1">
          <SaveAsTemplateDialog
            mode="edit"
            templateId={template.id}
            defaultName={template.name}
            defaultTitle={template.defaultTitle}
            defaultDescription={template.defaultDescription}
            defaultActivity={template.defaultActivity ?? undefined}
            defaultHours={template.defaultHours}
            activities={activities}
          >
            <Pencil className="size-3" aria-hidden />
            <span>Editar</span>
          </SaveAsTemplateDialog>
          <DeleteTemplateDialog
            templateName={template.name}
            onDelete={onDelete}
          >
            <Trash2 className="size-3" aria-hidden />
            <span>Eliminar</span>
          </DeleteTemplateDialog>
        </div>
      ) : null}
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["a", "b", "c", "d"].map((slot) => (
        <Skeleton key={slot} className="h-12 w-44 shrink-0" />
      ))}
    </div>
  );
}

function TemplatesEmpty() {
  return (
    <p className="text-muted-foreground text-xs">
      No hay plantillas disponibles. Escribe un título y una descripción,
      luego pulsa + para guardar la primera.
    </p>
  );
}

type TemplatesListProps = Readonly<{
  templates: readonly TimeLogTemplateDto[];
  activities: readonly string[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  onDelete: (id: string) => Promise<boolean> | boolean;
}>;

function TemplatesList({
  templates,
  activities,
  selectedId,
  onSelect,
  onClear,
  onDelete,
}: TemplatesListProps) {
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
            onSelect={() => onSelect(template.id)}
            onClear={onClear}
            onDelete={() => onDelete(template.id)}
            activities={activities}
          />
        ))}
      </div>
      {selectedId ? (
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline-offset-2 hover:underline"
        >
          <X className="size-3" aria-hidden />
          Quitar plantilla
        </button>
      ) : null}
    </div>
  );
}

export function TemplateSelectField({
  form,
  activities,
  lastSubmitted = null,
}: TemplateSelectFieldProps) {
  const { templates, loading, findById, remove } = useTimeLogTemplates();
  const [selectedId, setSelectedId] = useState<string>("");
  const { apply, clear } = useApplyTemplate(form, activities);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const template = findById(id);
    if (template) apply(template);
  };

  // Tras un save exitoso el formulario se resetea desde `useCreateTask`.
  // Como `lastSubmitted` recibe una referencia nueva en cada guardado,
  // separamos la respuesta en dos partes:
  //   1. `setSelectedId("")` — estado local de ESTE componente. Se hace
  //      durante el render con el patrón "store information from previous
  //      renders": React aplica el bailout porque el setState es del
  //      mismo componente.
  //   2. `clear()` — side effect sobre el `Controller` (otro componente).
  //      NO puede ejecutarse durante render (sería el error
  //      "Cannot update a component while rendering a different one"),
  //      así que va en un `useEffect`.
  const prevLastSubmittedRef = useRef(lastSubmitted);
  if (prevLastSubmittedRef.current !== lastSubmitted) {
    prevLastSubmittedRef.current = lastSubmitted;
    if (lastSubmitted) {
      setSelectedId("");
    }
  }

  const handleClearForm = useCallback(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (lastSubmitted) {
      handleClearForm();
    }
  }, [lastSubmitted, handleClearForm]);

  // Conservamos un `handleClear` unificado para los botones internos
  // ("Quitar plantilla" en `TemplatesList`), que sí pueden llamar
  // ambas operaciones de forma sincrónica tras un click del usuario.
  const handleClear = useCallback(() => {
    setSelectedId("");
    handleClearForm();
  }, [handleClearForm]);

  const currentTitle = form.watch("taskTitle") ?? "";
  const currentDescription = form.watch("description") ?? "";
  const currentActivity = form.watch("activity") ?? "";

  let content: React.ReactNode;
  if (loading && templates.length === 0) {
    content = <TemplatesSkeleton />;
  } else if (templates.length === 0) {
    content = <TemplatesEmpty />;
  } else {
    content = (
      <TemplatesList
        templates={templates}
        activities={activities}
        selectedId={selectedId}
        onSelect={handleSelect}
        onClear={handleClear}
        onDelete={remove}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <TbTemplate className="size-3.5" aria-hidden />
          Plantillas
          <span className="text-muted-foreground text-xs font-normal">
            · Escoge una o crea una nueva
          </span>
        </span>
        <SaveAsTemplateDialog
          defaultTitle={currentTitle}
          defaultDescription={currentDescription}
          defaultActivity={currentActivity}
          activities={activities}
        >
          <Plus className="size-4" aria-hidden />
        </SaveAsTemplateDialog>
      </div>
      {content}
    </div>
  );
}
