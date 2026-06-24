"use client";

import { useCallback, useId, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { useTaskMeta } from "@/hooks/use-task-meta";
import {
  isValidTemplateHoursString,
  parseTemplateHoursString,
} from "@/lib/time-log/template-hours";
import { cn } from "@/lib/utils";
import type {
  AdminCreateTimeLogTemplateBody,
  AdminTemplateScope,
} from "@/lib/schemas/time-log-template";
export type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

export type AdminTemplateDialogProps = Readonly<{
  /** Lista de scopes seleccionables (personal + 4 roles con seedKey + global). */
  scopeOptions: ReadonlyArray<{
    value: AdminTemplateScope;
    label: string;
    description: string;
  }>;
  mode?: "create" | "edit";
  currentScope?: AdminTemplateScope;
  /** Default para `create` mode (default: primer `scopeOptions`). */
  defaultScope?: AdminTemplateScope;
  /** Valores iniciales del form (en edit mode se prefillan al abrir). */
  defaultName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultActivity?: string | null;
  defaultHours?: number | null;
  /** Llamado al guardar. Devuelve `true` si tuvo éxito. */
  onSubmit: (payload: AdminCreateTimeLogTemplateBody) => Promise<boolean>;
  /** Trigger opcional (botón). Si se omite, no se renderiza trigger. */
  children?: React.ReactNode;
  /** Clases extra aplicadas al `<button>` trigger. Útil para darle estilo
   *  primary en CTAs como "Nueva plantilla". */
  triggerClassName?: string;
  /** disabled state */
  disabled?: boolean;
}>;

function scopeLabel(scope: AdminTemplateScope): string {
  if (scope === "global") return "todos los roles";
  if (scope === "product-owner") return "todos los Product Owners";
  return `todos los ${scope === "qa" ? "QA" : scope.charAt(0).toUpperCase() + scope.slice(1)}s`;
}

type ScopeTileProps = Readonly<{
  id: string;
  value: AdminTemplateScope;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (value: AdminTemplateScope) => void;
}>;

function ScopeTile({
  id,
  value,
  label,
  selected,
  disabled = false,
  onSelect,
}: ScopeTileProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group relative flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40 font-medium"
          : "border-border hover:border-primary/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        id={id}
        type="radio"
        name="admin-template-scope"
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? (
        <Check className="text-primary size-4 shrink-0" aria-hidden />
      ) : null}
    </label>
  );
}

/**
 * Diálogo unificado para que el super_admin cree o edite plantillas por
 * scope (rol o global). El selector de scope es una grid responsiva de
 * tiles (no SegmentedControl) para que cada opción tenga su descripción
 * visible y se adapte a cualquier ancho de pantalla.
 */
export function AdminTemplateDialog({
  scopeOptions,
  mode = "create",
  currentScope,
  defaultScope,
  defaultName,
  defaultTitle,
  defaultDescription,
  defaultActivity,
  defaultHours,
  onSubmit,
  children,
  triggerClassName,
  disabled = false,
}: AdminTemplateDialogProps) {
  const fallbackScope: AdminTemplateScope =
    defaultScope ?? scopeOptions[0]?.value ?? "global";
  // Mismas activities que el form Individual y el `SaveAsTemplateDialog`
  // per-user: provienen de Azure vía `/api/copilot/task-meta` con fallback a
  // `TASK_ACTIVITY_VALUES` si la API falla.
  const { activities: activityOptions } = useTaskMeta();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState("");
  const [hours, setHours] = useState("");
  const [scope, setScope] = useState<AdminTemplateScope>(
    currentScope ?? fallbackScope,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeGroupId = useId();

  const isEdit = mode === "edit";

  /**
   * Sembramos el state desde las props `defaultX` (en edit mode vienen del
   * template a editar). Si las props cambian tras montar, NO re-sincronizamos
   * — el state interno es la fuente de verdad mientras el dialog está abierto.
   */
  const seedFromDefaults = useCallback(() => {
    setName(defaultName ?? "");
    setTitle(defaultTitle ?? "");
    setDescription(defaultDescription ?? "");
    setActivity(defaultActivity ?? "");
    setHours(defaultHours != null ? String(defaultHours) : "");
    setScope(currentScope ?? fallbackScope);
    setError(null);
  }, [
    defaultName,
    defaultTitle,
    defaultDescription,
    defaultActivity,
    defaultHours,
    currentScope,
    fallbackScope,
  ]);

  const reset = () => {
    seedFromDefaults();
    setSubmitting(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      seedFromDefaults();
      setSubmitting(false);
    }
  };

  const canSubmit =
    name.trim().length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    isValidTemplateHoursString(hours);

  const handleSave = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload: AdminCreateTimeLogTemplateBody = {
      name: name.trim(),
      defaultTitle: title.trim(),
      defaultDescription: description.trim(),
      defaultActivity: activity.trim() || undefined,
      defaultHours: parseTemplateHoursString(hours),
      scope,
    };
    const ok = await onSubmit(payload);
    setSubmitting(false);
    if (ok) {
      setOpen(false);
      reset();
    } else {
      setError("No pudimos guardar la plantilla.");
    }
  };

  const selectedScope = scopeOptions.find((s) => s.value === scope);
  const hoursInvalid = !isValidTemplateHoursString(hours);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "inline-flex items-center",
                disabled && "pointer-events-none opacity-50",
                triggerClassName,
              )}
            >
              {children}
            </button>
          }
        />
      ) : null}
      <DialogContent
        keepMounted
        className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar plantilla" : "Nueva plantilla"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los valores por defecto. El alcance define quién verá esta plantilla."
              : "Crea una plantilla reutilizable para un rol específico o para todos los roles."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-template-name">Nombre</Label>
            <Input
              id="admin-template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Code review semanal"
              autoFocus
              disabled={submitting}
            />
          </div>

          <fieldset className="flex flex-col gap-2" disabled={submitting}>
            <legend className="text-sm font-medium">Alcance</legend>
            <div
              role="radiogroup"
              aria-label="Alcance de la plantilla"
              id={scopeGroupId}
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            >
              {scopeOptions.map((option) => (
                <ScopeTile
                  key={option.value}
                  id={`${scopeGroupId}-${option.value}`}
                  value={option.value}
                  label={option.label}
                  selected={scope === option.value}
                  onSelect={setScope}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {selectedScope
                ? `Visible para ${scopeLabel(scope)}.`
                : null}
            </p>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-template-title">Título por defecto</Label>
            <Input
              id="admin-template-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-template-description">
              Descripción por defecto
            </Label>
            <Textarea
              id="admin-template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-template-activity">
              Actividad por defecto{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (opcional)
              </span>
            </Label>
            <select
              id="admin-template-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              disabled={submitting}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">(no asignar)</option>
              {activityOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-template-hours">
              Horas por defecto{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (opcional, máx 24)
              </span>
            </Label>
            <Input
              id="admin-template-hours"
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Ej. 1.5"
              disabled={submitting}
              aria-invalid={hoursInvalid}
            />
            {hoursInvalid ? (
              <p className="text-destructive text-xs">
                Las horas deben ser mayores a 0 y como máximo 24.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={submitting} />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="size-4" aria-hidden />
            )}
            {isEdit ? "Guardar cambios" : "Crear plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export del tipo de payload para que el caller no necesite importarlo
// desde schemas dos veces.
export type { AdminCreateTimeLogTemplateBody, AdminTemplateScope };
