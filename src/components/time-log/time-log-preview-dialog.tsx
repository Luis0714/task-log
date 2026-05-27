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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { CreateTaskPayload } from "@/lib/schemas/time-log";
import { TASK_ACTIVITY_LABELS, type TaskActivity } from "@/lib/time-log/task-constants";
import { cn } from "@/lib/utils";

export type TimeLogPreviewDialogProps = {
  open: boolean;
  preview: CreateTaskPayload | null;
  defaultCompletedTaskState?: string | null;
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
    <div className="min-w-0 space-y-1">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="min-w-0 text-sm wrap-break-word">{children}</div>
    </div>
  );
}

export function TimeLogPreviewDialog({
  open,
  preview,
  defaultCompletedTaskState = null,
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
      <DialogContent
        className={cn(
          "flex! w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0",
          "max-h-[min(100dvh,92dvh)] sm:max-h-[min(90vh,720px)] sm:max-w-lg",
          "max-sm:top-auto max-sm:bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))]",
          "max-sm:translate-y-0 max-sm:rounded-2xl",
        )}
      >
        <DialogHeader className="shrink-0 gap-2 p-4 pr-12 pb-3 sm:pr-4">
          <DialogTitle className="text-pretty leading-snug">Confirmar creación de tarea</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 pb-4">
          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Tarea a crear
            </p>
            <div className="flex min-w-0 flex-wrap gap-2">
              <Badge className="max-w-full shrink truncate" variant="secondary">
                Crear tarea
              </Badge>
              <Badge className="shrink-0" variant="outline">
                {preview.hours} h
              </Badge>
              <Badge className="max-w-full shrink truncate" variant="outline">
                {activityLabel}
              </Badge>
              <Badge className="shrink-0" variant="outline">
                {preview.workingDate}
              </Badge>
              {preview.markAsDone ? (
                <Badge className="max-w-full shrink truncate" variant="default">
                  → {defaultCompletedTaskState ?? "Done"}
                </Badge>
              ) : (
                <Badge className="max-w-full shrink truncate" variant="outline">
                  {preview.state}
                </Badge>
              )}
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

          <Separator />

          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Historia de usuario padre
            </p>
            <div className="min-w-0 overflow-hidden rounded-lg border bg-muted/30 p-3">
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

          {!adoExecutionReady && (
            <Alert variant="destructive">
              <AlertTitle>Sin acceso a Azure DevOps</AlertTitle>
              <AlertDescription>{getConnectionHint(authMethod)}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 border-t bg-muted/50 p-4 max-sm:flex-col-reverse sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:min-h-0 sm:w-auto"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="min-h-11 w-full sm:min-h-0 sm:w-auto"
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
