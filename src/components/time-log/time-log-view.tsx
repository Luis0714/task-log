"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { CopilotHistoryList } from "@/components/copilot/copilot-history-list";
import { CopilotPreviewCard } from "@/components/copilot/copilot-preview-card";
import { TimeLogCopilotLink, TimeLogForm } from "@/components/time-log/time-log-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useTimeLogForm } from "@/hooks/use-time-log-form";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";

export type TimeLogViewProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
};

export function TimeLogView({ adoExecutionReady, authMethod }: TimeLogViewProps) {
  const { history, appendEntry } = useCopilotHistory();
  const form = useTimeLogForm({ appendHistory: appendEntry });

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Registro de tiempo
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Registra horas en un work item de forma manual. Siempre confirmarás antes de enviar a
          Azure DevOps.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formulario</CardTitle>
          <CardDescription>
            Elige sprint y work item desde Azure DevOps, luego horas y comentario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeLogForm
            form={form.form}
            adoExecutionReady={adoExecutionReady}
            loading={form.loadingExecute}
            onSubmit={form.prepareSubmit}
          />
          <TimeLogCopilotLink />
        </CardContent>
      </Card>

      {form.error && <CopilotErrorAlert message={form.error} />}

      {form.preview && (
        <CopilotPreviewCard
          preview={form.preview}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={form.loadingExecute}
          onConfirm={(payload) => void form.execute(payload)}
          onCancel={form.dismissPreview}
        />
      )}

      <CopilotHistoryList entries={history} />
    </div>
  );
}
