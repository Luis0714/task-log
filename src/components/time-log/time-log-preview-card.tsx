"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

import { WorkItemSelectOption } from "@/components/time-log/work-item-select-option";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { CreateTaskPayload } from "@/lib/schemas/time-log";
import { TASK_ACTIVITY_LABELS, type TaskActivity } from "@/lib/time-log/task-constants";
import { cn } from "@/lib/utils";

export type TimeLogPreviewCardProps = {
  preview: CreateTaskPayload;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loading?: boolean;
  className?: string;
  onConfirm: (preview: CreateTaskPayload) => void;
  onCancel: () => void;
};

function getConnectionHint(authMethod: AzdoAuthMethod): string {
  if (authMethod === "pat") {
    return "Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT en el servidor.";
  }
  return "Conecta tu cuenta con OAuth en Configuración.";
}

export function TimeLogPreviewCard({
  preview,
  adoExecutionReady,
  authMethod,
  loading = false,
  className,
  onConfirm,
  onCancel,
}: TimeLogPreviewCardProps) {
  return (
    <Card className={cn("min-w-0 border-primary/25 ring-primary/10", className)}>
      <CardHeader className="pb-2">
        <CardTitle>Confirmar creación de tarea</CardTitle>
        <CardDescription className="text-pretty">
          Se creará una tarea hija de la historia de usuario en Azure DevOps con las horas indicadas. La tarea
          quedará en estado inicial Por hacer (o equivalente abierto del proceso).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Historia de usuario padre
          </p>
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

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Crear tarea</Badge>
          <Badge variant="outline">{preview.project}</Badge>
          <Badge variant="outline">{preview.hours} h</Badge>
          <Badge variant="outline">
            {TASK_ACTIVITY_LABELS[preview.activity as TaskActivity] ?? preview.activity}
          </Badge>
          <Badge variant="outline">{preview.workingDate}</Badge>
          <Badge variant="outline">{preview.state}</Badge>
        </div>

        <div className="space-y-1 text-sm">
          <p className="break-words">
            <span className="text-foreground font-medium">Título: </span>
            {preview.title}
          </p>
          {preview.description ? (
            <p className="text-muted-foreground break-words">
              <span className="text-foreground font-medium">Descripción: </span>
              {preview.description}
            </p>
          ) : null}
        </div>

        {!adoExecutionReady && (
          <Alert variant="destructive">
            <AlertTitle>Sin acceso a Azure DevOps</AlertTitle>
            <AlertDescription>{getConnectionHint(authMethod)}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row">
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
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={loading}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}
