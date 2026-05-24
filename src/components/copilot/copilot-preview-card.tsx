"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

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
import type { LogWorkPayload } from "@/lib/schemas/agent";

export type CopilotPreviewCardProps = {
  preview: LogWorkPayload;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loading?: boolean;
  onConfirm: (preview: LogWorkPayload) => void;
  onCancel: () => void;
};

function getConnectionHint(authMethod: AzdoAuthMethod): string {
  if (authMethod === "pat") {
    return "Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT en el servidor.";
  }
  return "Conecta tu cuenta con OAuth en Configuración.";
}

export function CopilotPreviewCard({
  preview,
  adoExecutionReady,
  authMethod,
  loading = false,
  onConfirm,
  onCancel,
}: CopilotPreviewCardProps) {
  return (
    <Card className="border-primary/25 ring-primary/10">
      <CardHeader className="pb-2">
        <CardTitle>Confirmar registro</CardTitle>
        <CardDescription>
          Revisa los datos antes de enviar a Azure DevOps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">log_work</Badge>
          <Badge variant="outline">WI #{preview.workItemId}</Badge>
          <Badge variant="outline">{preview.hours} h</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Comentario: </span>
          {preview.comment}
        </p>
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
          Confirmar y ejecutar
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
