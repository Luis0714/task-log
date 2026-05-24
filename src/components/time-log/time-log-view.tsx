"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { CopilotHistoryList } from "@/components/copilot/copilot-history-list";
import { TimeLogCopilotLink, TimeLogForm } from "@/components/time-log/time-log-form";
import { TimeLogPreviewCard } from "@/components/time-log/time-log-preview-card";
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
  defaultProject?: string | null;
};

export function TimeLogView({
  adoExecutionReady,
  authMethod,
  defaultProject = null,
}: TimeLogViewProps) {
  const { history, appendEntry } = useCopilotHistory();
  const form = useTimeLogForm({
    appendHistory: appendEntry,
    defaultProject,
    adoExecutionReady,
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Registro de tiempo
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Elige la historia del sprint, crea la tarea con tus horas y confirma antes de enviar a
          Azure DevOps.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formulario</CardTitle>
          <CardDescription>
            Paso 1: contexto (proyecto, sprint, PBI). Paso 2: datos de la Task (título, horas,
            activity, fecha).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeLogForm
            form={form.form}
            catalog={form.catalog}
            step={form.step}
            adoExecutionReady={adoExecutionReady}
            loading={form.loadingExecute}
            onContinue={() => void form.goToStep2()}
            onBack={form.goToStep1}
            onSubmit={form.prepareSubmit}
          />
          <TimeLogCopilotLink />
        </CardContent>
      </Card>

      {form.error && <CopilotErrorAlert message={form.error} />}

      {form.preview && (
        <TimeLogPreviewCard
          preview={form.preview}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={form.loadingExecute}
          onConfirm={() => form.preview && void form.execute(form.preview)}
          onCancel={form.dismissPreview}
        />
      )}

      <CopilotHistoryList entries={history} />
    </div>
  );
}
