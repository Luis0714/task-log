"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { AdminTemplateDialog } from "@/components/admin/admin-template-dialog";
import { DeleteTemplateDialog } from "@/components/time-log/fields/delete-template-dialog";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  ADMIN_TEMPLATE_SCOPES,
  type AdminCreateTimeLogTemplateBody,
  type AdminTemplateScope,
  type AdminUpdateTimeLogTemplateBody,
  type TimeLogTemplateDto,
} from "@/lib/schemas/time-log-template";
import { useAdminTemplates } from "@/hooks/admin/use-admin-templates";

export type AdminTemplatesTableProps = Readonly<{
  templates: TimeLogTemplateDto[];
}>;

const SCOPE_LABEL: Record<AdminTemplateScope, string> = {
  personal: "Personal",
  developer: "Developer",
  qa: "QA",
  designer: "Designer",
  "product-owner": "Product Owner",
  global: "Global",
};

const SCOPE_DESCRIPTION: Record<AdminTemplateScope, string> = {
  personal: "Solo tú (el admin) verás esta plantilla.",
  developer: "Visible para todos los usuarios con rol Developer.",
  qa: "Visible para todos los usuarios con rol QA.",
  designer: "Visible para todos los usuarios con rol Designer.",
  "product-owner": "Visible para todos los usuarios con rol Product Owner.",
  global: "Visible para todos los usuarios del workspace.",
};

const SCOPE_OPTIONS: ReadonlyArray<{
  value: AdminTemplateScope;
  label: string;
  description: string;
}> = ADMIN_TEMPLATE_SCOPES.map((value) => ({
  value,
  label: SCOPE_LABEL[value],
  description: SCOPE_DESCRIPTION[value],
}));

const SCOPE_FILTER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "personal", label: "Personal" },
  { value: "global", label: "Global" },
  { value: "developer", label: "Developer" },
  { value: "qa", label: "QA" },
  { value: "designer", label: "Designer" },
  { value: "product-owner", label: "Product Owner" },
];

function scopeFromTemplate(
  template: TimeLogTemplateDto,
): AdminTemplateScope | "personal" {
  if (template.isSystem && template.seedKey) {
    const found = ADMIN_TEMPLATE_SCOPES.find((s) => s === template.seedKey);
    if (found) return found;
  }
  return "personal";
}

function ScopeChip({
  scope,
}: {
  scope: AdminTemplateScope | "personal";
}) {
  const baseClass =
    "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";
  if (scope === "personal") {
    return (
      <span
        className={cn(baseClass, "bg-muted text-muted-foreground")}
        title="Personal"
      >
        Personal
      </span>
    );
  }
  if (scope === "global") {
    return (
      <span
        className={cn(baseClass, "bg-primary/10 text-primary")}
        title="Global"
      >
        Global
      </span>
    );
  }
  return (
    <span
      className={cn(
        baseClass,
        "bg-secondary text-secondary-foreground",
      )}
      title={SCOPE_LABEL[scope]}
    >
      <span className="truncate">{SCOPE_LABEL[scope]}</span>
    </span>
  );
}

function CreatorLabel({ template }: Readonly<{ template: TimeLogTemplateDto }>) {
  if (template.userId === null) {
    return <span className="text-muted-foreground text-xs">Sistema</span>;
  }
  if (template.authorName) {
    return (
      <span className="text-foreground text-xs font-medium">
        {template.authorName}
      </span>
    );
  }
  // userId presente pero sin displayName (usuario eliminado o display_name NULL).
  return <span className="text-muted-foreground text-xs">Personal</span>;
}

type TemplateActionsProps = Readonly<{
  row: TimeLogTemplateDto;
  scope: AdminTemplateScope | "personal";
  onUpdate: (id: string, payload: AdminUpdateTimeLogTemplateBody) => Promise<boolean>;
  onDelete: (template: TimeLogTemplateDto) => Promise<boolean>;
  /** Variante visual: `inline` para celdas de tabla, `block` para cards. */
  variant?: "inline" | "block";
}>;

function TemplateActions({
  row,
  scope,
  onUpdate,
  onDelete,
  variant = "inline",
}: Readonly<TemplateActionsProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        variant === "inline" ? "justify-end" : "mt-2 justify-end",
      )}
    >
      <AdminTemplateDialog
        scopeOptions={SCOPE_OPTIONS}
        mode="edit"
        currentScope={scope === "personal" ? undefined : scope}
        defaultName={row.name}
        defaultTitle={row.defaultTitle}
        defaultDescription={row.defaultDescription}
        defaultActivity={row.defaultActivity}
        defaultHours={row.defaultHours}
        onSubmit={(payload) => onUpdate(row.id, payload)}
      >
        <Pencil className="size-3.5" aria-hidden />
      </AdminTemplateDialog>
      <DeleteTemplateDialog
        templateName={row.name}
        onDelete={() => onDelete(row)}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </DeleteTemplateDialog>
    </div>
  );
}

export function AdminTemplatesTable({ templates }: AdminTemplatesTableProps) {
  const { rows, createTemplate, updateTemplate, deleteTemplate } =
    useAdminTemplates(templates);
  const [scopeFilter, setScopeFilter] = useState<string>("all");

  const filteredRows = useMemo(() => {
    if (scopeFilter === "all") return rows;
    return rows.filter((r) => scopeFromTemplate(r) === scopeFilter);
  }, [rows, scopeFilter]);

  const handleCreate = async (
    payload: AdminCreateTimeLogTemplateBody,
  ): Promise<boolean> => {
    const created = await createTemplate(payload);
    if (!created) {
      appToast.error("No pudimos crear la plantilla.");
      return false;
    }
    appToast.success(`Plantilla "${created.name}" creada.`);
    return true;
  };

  const handleUpdate = async (
    templateId: string,
    payload: AdminUpdateTimeLogTemplateBody,
  ): Promise<boolean> => {
    const updated = await updateTemplate(templateId, payload);
    if (!updated) {
      appToast.error("No pudimos guardar los cambios.");
      return false;
    }
    appToast.success(`Plantilla "${updated.name}" actualizada.`);
    return true;
  };

  const handleDelete = async (template: TimeLogTemplateDto) => {
    const ok = await deleteTemplate(template.id);
    if (ok) {
      appToast.success(`Plantilla "${template.name}" eliminada.`);
    } else {
      appToast.error("No pudimos eliminar la plantilla.");
    }
    return ok;
  };

  const emptyState = (
    <div className="text-muted-foreground px-3 py-6 text-center text-sm">
      No hay plantillas para este filtro.
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          role="radiogroup"
          aria-label="Filtrar plantillas por alcance"
          className="-mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 sm:flex-nowrap sm:overflow-visible"
        >
          {SCOPE_FILTER_OPTIONS.map((option) => {
            const selected = scopeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setScopeFilter(option.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <AdminTemplateDialog
          scopeOptions={SCOPE_OPTIONS}
          defaultScope="developer"
          onSubmit={handleCreate}
          triggerClassName="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium gap-1.5"
        >
          <Plus aria-hidden />
          Nueva plantilla
        </AdminTemplateDialog>
      </div>

      {/* Desktop / tablet: tabla densa */}
      <div className="border-border/60 hidden overflow-hidden rounded-lg border sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-left font-medium">Título por defecto</th>
              <th className="px-3 py-2 text-left font-medium">Alcance</th>
              <th className="px-3 py-2 text-left font-medium">Creador</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center">
                  {emptyState}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const scope = scopeFromTemplate(row);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-border/40 border-t",
                      row.pending && "opacity-60",
                    )}
                  >
                    <td className="px-3 py-2 align-middle font-medium">
                      <span className="flex items-center gap-2">
                        {row.name}
                        {row.pending ? (
                          <Loader2
                            className="text-muted-foreground size-3 animate-spin"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 align-middle">
                      <span className="line-clamp-1 max-w-md">
                        {row.defaultTitle}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <ScopeChip scope={scope} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <CreatorLabel template={row} />
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <TemplateActions
                        row={row}
                        scope={scope}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        variant="inline"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Móvil: lista de cards (cada fila apilada) */}
      <ul className="space-y-2 sm:hidden">
        {filteredRows.length === 0 ? (
          <li>{emptyState}</li>
        ) : (
          filteredRows.map((row) => {
            const scope = scopeFromTemplate(row);
            return (
              <li
                key={row.id}
                className={cn(
                  "border-border/60 bg-card space-y-1.5 rounded-lg border p-3",
                  row.pending && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{row.name}</span>
                    {row.pending ? (
                      <Loader2
                        className="text-muted-foreground size-3 shrink-0 animate-spin"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <ScopeChip scope={scope} />
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {row.defaultTitle}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <CreatorLabel template={row} />
                  <TemplateActions
                    row={row}
                    scope={scope}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    variant="block"
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
