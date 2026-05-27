"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { WorkItemSelectOption } from "@/components/time-log/work-item-select-option";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { CreateTaskPayload } from "@/lib/schemas/time-log";
import { TASK_ACTIVITY_LABELS, type TaskActivity } from "@/lib/time-log/task-constants";

export type TimeLogPreviewDialogProps = {
  open: boolean;
  preview: CreateTaskPayload | null;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loading?: boolean;
  onConfirm: (preview: CreateTaskPayload) => void;
  onOpenChange: (open: boolean) => void;
};

function getConnectionHint(authMethod: AzdoAuthMethod): string {
  if (authMethod === "pat") {
    return "Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT en el servidor.";
  }
  return "Conecta tu cuenta con OAuth en Configuración.";
}

function PreviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm break-words">{children}</div>
    </div>
  );
}

export function TimeLogPreviewDialog({
  open,
  preview,
  adoExecutionReady,
  authMethod,
  loading = false,
  onConfirm,
  onOpenChange,
}: TimeLogPreviewDialogProps) {
  if (!preview) {
    return null;
  }

  const activityLabel =
    TASK_ACTIVITY_LABELS[preview.activity as TaskActivity] ?? preview.activity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="gap-2 p-4 pb-3">
          <DialogTitle>Confirmar creación de tarea</DialogTitle>
          <DialogDescription className="text-pretty">
            Revisa el resumen antes de crear la tarea hija en Azure DevOps. Podrás cancelar si
            necesitas ajustar algún dato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4">
          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Contexto
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewField label="Proyecto">{preview.project}</PreviewField>
              <PreviewField label="Equipo">{preview.team}</PreviewField>
            </div>
            <PreviewField label="Sprint">
              <span className="font-mono text-xs">{preview.sprintPath}</span>
            </PreviewField>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Historia de usuario padre
            </p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <WorkItemSelectOption
                item={{
                  id: preview.pbiId,
                  title: preview.pbiTitle,
                  type: "User Story",
                  state: "",
                }}
                variant="menu"
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Tarea a crear
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Crear tarea</Badge>
              <Badge variant="outline">{preview.hours} h</Badge>
              <Badge variant="outline">{activityLabel}</Badge>
              <Badge variant="outline">{preview.workingDate}</Badge>
              <Badge variant="outline">{preview.state}</Badge>
            </div>
            <PreviewField label="Título">
              <span className="font-medium">{preview.title}</span>
            </PreviewField>
            <PreviewField label="Descripción">
              {preview.description ? (
                <span className="text-muted-foreground whitespace-pre-wrap">{preview.description}</span>
              ) : (
                <span className="text-muted-foreground italic">Sin descripción</span>
              )}
            </PreviewField>
          </section>

          {!adoExecutionReady && (
            <Alert variant="destructive">
              <AlertTitle>Sin acceso a Azure DevOps</AlertTitle>
              <AlertDescription>{getConnectionHint(authMethod)}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={loading || !adoExecutionReady}
            onClick={() => onConfirm(preview)}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            Confirmar y crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
