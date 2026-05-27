"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { CopilotPreviewCard } from "@/components/copilot/copilot-preview-card";
import { CopilotResultMessage } from "@/components/copilot/copilot-result-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCopilot } from "@/hooks/use-copilot";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";

export type CopilotViewProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
};

export function CopilotView({ adoExecutionReady, authMethod }: CopilotViewProps) {
  const { appendEntry } = useCopilotHistory();
  const copilot = useCopilot({ appendHistory: appendEntry });

  const showOtherPreview =
    copilot.preview &&
    copilot.preview.action !== "log_work";

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Copiloto IA
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Describe qué hiciste en lenguaje natural. Siempre verás una vista previa antes de
          ejecutar en Azure DevOps.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tu mensaje</CardTitle>
          <CardDescription>
            Incluye horas y el ID o referencia del elemento de trabajo (ej. US-123).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopilotInput
            value={copilot.message}
            onChange={copilot.setMessage}
            onSubmit={() => void copilot.interpret()}
            loading={copilot.loadingPreview}
          />
        </CardContent>
      </Card>

      {copilot.error && <CopilotErrorAlert message={copilot.error} />}

      {copilot.preview?.action === "log_work" && (
        <CopilotPreviewCard
          preview={copilot.preview}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={copilot.loadingExecute}
          onConfirm={(payload) => void copilot.execute(payload)}
          onCancel={copilot.dismissPreview}
        />
      )}

      {showOtherPreview && copilot.preview && (
        <CopilotResultMessage preview={copilot.preview} />
      )}
    </div>
  );
}
