"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTimeLogTemplates } from "@/hooks/use-time-log-templates";
import { useApplyTemplate } from "@/hooks/time-log/use-apply-template";
import { SaveAsTemplateDialog } from "@/components/time-log/save-as-template-dialog";
import { DeleteTemplateDialog } from "@/components/time-log/fields/delete-template-dialog";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TemplateSelectFieldProps = {
  form: UseFormReturn<TimeLogFormValues>;
  activities: readonly string[];
};

type BadgeVariant = "role" | "global" | "personal";

function badgeFor(
  template: TimeLogTemplateDto,
): { label: string; variant: BadgeVariant } {
  if (!template.isSystem) return { label: "Personal", variant: "personal" };
  if (template.seedKey === "global") return { label: "Global", variant: "global" };
  return { label: "Tu rol", variant: "role" };
}

function TemplateCardBadge({
  variant,
  label,
}: {
  variant: BadgeVariant;
  label: string;
}) {
  return (
    <span
      className={cn(
        "text-[9px] tracking-wide uppercase",
        variant === "personal" ? "text-muted-foreground" : "text-primary/70",
      )}
    >
      {label}
    </span>
  );
}

type TemplateCardProps = {
  template: TimeLogTemplateDto;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
  onDelete: () => Promise<boolean> | boolean;
  activities: readonly string[];
};

function TemplateCard({
  template,
  selected,
  onSelect,
  onClear,
  onDelete,
  activities,
}: Readonly<TemplateCardProps>) {
  const { label, variant } = badgeFor(template);
  const hasActions = !template.isSystem;

  return (
    <div
      className={cn(
        "flex w-32 shrink-0 flex-col rounded-md border transition",
        "hover:border-primary/40",
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
          "flex flex-col items-start gap-0.5 px-2.5 py-1.5 text-left hover:bg-accent/30",
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

      {hasActions && (
        <div className="border-border/50 flex items-center justify-end gap-2 border-t px-2 py-0.5">
          <SaveAsTemplateDialog
            mode="edit"
            templateId={template.id}
            defaultName={template.name}
            defaultTitle={template.defaultTitle}
            defaultDescription={template.defaultDescription}
            defaultActivity={template.defaultActivity ?? undefined}
            activities={activities}
          >
            <Pencil className="size-3" aria-hidden />
          </SaveAsTemplateDialog>
          <DeleteTemplateDialog
            templateName={template.name}
            onDelete={onDelete}
          >
            <Trash2 className="size-3" aria-hidden />
          </DeleteTemplateDialog>
        </div>
      )}
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["s1", "s2", "s3", "s4"].map((key) => (
        <Skeleton key={key} className="h-12 w-28 shrink-0" />
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

type TemplatesListProps = {
  templates: readonly TimeLogTemplateDto[];
  activities: readonly string[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  onDelete: (id: string) => Promise<boolean> | boolean;
};

function TemplatesList({
  templates,
  activities,
  selectedId,
  onSelect,
  onClear,
  onDelete,
}: Readonly<TemplatesListProps>) {
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
}: Readonly<TemplateSelectFieldProps>) {
  const { templates, loading, findById, remove } = useTimeLogTemplates();
  const [selectedId, setSelectedId] = useState<string>("");
  const { apply, clear } = useApplyTemplate(form, activities);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const template = findById(id);
    if (template) apply(template);
  };

  const handleClear = () => {
    setSelectedId("");
    clear();
  };

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
          <Sparkles className="size-3.5" aria-hidden />
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
