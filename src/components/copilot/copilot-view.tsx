"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { CopilotPreviewCard } from "@/components/copilot/copilot-preview-card";
import { CopilotResultMessage } from "@/components/copilot/copilot-result-message";
import { PageHeader } from "@/components/layout/page-header";
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
import { cn } from "@/lib/utils";

export type CopilotViewProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  dailySection?: ReactNode;
};

export function CopilotView({
  adoExecutionReady,
  authMethod,
  dailySection,
}: Readonly<CopilotViewProps>) {
  const { appendEntry } = useCopilotHistory();
  const copilot = useCopilot({ appendHistory: appendEntry });

  const showOtherPreview =
    copilot.preview &&
    copilot.preview.action !== "log_work";

  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 xl:max-w-3xl",
      )}
    >
      <PageHeader
        title="Copiloto IA"
        description="Describe qué hiciste en lenguaje natural. Siempre verás una vista previa antes de ejecutar en Azure DevOps."
      />

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

      {dailySection}

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
