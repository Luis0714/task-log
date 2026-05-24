"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PreviewResult } from "@/lib/schemas/agent";

export type CopilotResultMessageProps = {
  preview: PreviewResult;
};

export function CopilotResultMessage({ preview }: CopilotResultMessageProps) {
  if (preview.action === "needs_clarification") {
    return (
      <Alert>
        <AlertTitle>Aclaración necesaria</AlertTitle>
        <AlertDescription>{preview.question}</AlertDescription>
      </Alert>
    );
  }

  if (preview.action === "unsupported") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Acción no soportada</AlertTitle>
        <AlertDescription>{preview.reason}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
