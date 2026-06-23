"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTimeLogTemplates } from "@/hooks/use-time-log-templates";
import { cn } from "@/lib/utils";

export type SaveAsTemplateDialogProps = {
  /** Título por defecto sugerido (viene del campo "taskTitle" del form). */
  defaultTitle: string;
  /** Descripción por defecto (viene del campo "description" del form). */
  defaultDescription: string;
  /** Actividad actual del form (opcional, se preselecciona en el dialog). */
  defaultActivity?: string;
  /**
   * Nombre de la plantilla precargado. En modo `create` se ignora (el
   * usuario lo tipea). En modo `edit` se usa para que el campo "Nombre"
   * aparezca con el valor actual.
   */
  defaultName?: string;
  /**
   * Valores válidos de actividad del proyecto. Si llega una lista vacía, el
   * campo de actividad se oculta (el proyecto no tiene el campo Activity,
   * p.ej. proceso Basic).
   */
  activities: readonly string[];
  disabled?: boolean;
  /**
   * Trigger opcional. Si se pasa, reemplaza el botón por defecto
   * "Guardar como plantilla". Útil para integrarlo con un + pequeño en
   * la cabecera del selector de plantillas o con un menú contextual.
   */
  children?: React.ReactNode;
  /**
   * Modo del dialog. "create" muestra "Guardar plantilla" (default).
   * "edit" muestra "Guardar cambios" y un botón "Eliminar plantilla".
   */
  mode?: "create" | "edit";
  /**
   * Solo en modo "edit": id de la plantilla a editar. Se usa para las
   * llamadas a update/remove.
   */
  templateId?: string;
};

/**
 * Diálogo unificado para crear o editar una plantilla. Por defecto abre
 * en modo `create` desde los valores actuales del formulario. En modo
 * `edit` recibe un `templateId` y muestra además un botón "Eliminar".
 *
 * El campo "Actividad" es opcional: si la actividad seleccionada en el
 * form sigue siendo válida, se preselecciona; el usuario puede cambiarla
 * o dejarla en blanco para que la plantilla NO fuerce una actividad al
 * aplicarse.
 */
export function SaveAsTemplateDialog({
  defaultTitle,
  defaultDescription,
  defaultActivity,
  defaultName,
  activities,
  disabled = false,
  children,
  mode = "create",
  templateId,
}: Readonly<SaveAsTemplateDialogProps>) {
  const { create, update } = useTimeLogTemplates();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(mode === "edit" ? defaultName ?? "" : "");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [activity, setActivity] = useState(defaultActivity ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0;

  const isEdit = mode === "edit";

  const reset = () => {
    setName("");
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    setActivity(defaultActivity ?? "");
    setSubmitting(false);
    setError(null);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setName(mode === "edit" ? defaultName ?? "" : "");
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setActivity(defaultActivity ?? "");
      setSubmitting(false);
      setError(null);
    }
  };

  const onSave = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      name: name.trim(),
      defaultTitle: title.trim(),
      defaultDescription: description.trim(),
      defaultActivity: activity.trim() || undefined,
    };
    const result =
      isEdit && templateId
        ? await update(templateId, payload)
        : await create(payload);
    setSubmitting(false);
    if (result) {
      setOpen(false);
      reset();
    } else {
      setError("No pudimos guardar la plantilla.");
    }
  };

  const disabledReason =
    defaultTitle.trim().length === 0 || defaultDescription.trim().length === 0
      ? "Necesitas un título y una descripción para guardar como plantilla."
      : undefined;

  const isDisabled = disabled || Boolean(disabledReason);
  const showActivityField = activities.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger
          render={
            <button
              type="button"
              disabled={isDisabled}
              aria-label={
                isEdit
                  ? "Editar plantilla"
                  : "Crear plantilla con los valores actuales"
              }
              className={cn(
                "inline-flex items-center justify-center rounded focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
                isEdit
                  ? "text-muted-foreground hover:text-foreground p-0.5"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 border",
              )}
            >
              {children}
            </button>
          }
        />
      ) : (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled}
              title={disabledReason}
              className={cn("gap-1.5")}
            >
              <BookmarkPlus className="size-4" aria-hidden />
              Guardar como plantilla
            </Button>
          }
        />
      )}
      <DialogContent keepMounted>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar plantilla" : "Guardar como plantilla"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los valores por defecto. La plantilla es privada y solo la verás tú."
              : "Crea una plantilla reutilizable con los valores actuales. Solo la verás tú."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Nombre</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Code review semanal"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-title">Título por defecto</Label>
            <Input
              id="template-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-description">Descripción por defecto</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {showActivityField ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-activity">
                Actividad por defecto{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (opcional)
                </span>
              </Label>
              <select
                id="template-activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                <option value="">(no asignar)</option>
                {activities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <BookmarkPlus className="size-4" aria-hidden />
            )}
            {isEdit ? "Guardar cambios" : "Guardar plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
