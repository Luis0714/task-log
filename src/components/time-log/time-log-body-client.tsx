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
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";

export type TimeLogBodyClientProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  defaultProject?: string | null;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
};

export function TimeLogBodyClient({
  adoExecutionReady,
  authMethod,
  defaultProject = null,
  serverBaseline,
  pbisSnapshot,
}: TimeLogBodyClientProps) {
  const { history, appendEntry } = useCopilotHistory();
  const form = useTimeLogForm({
    appendHistory: appendEntry,
    defaultProject,
    adoExecutionReady,
    serverBaseline,
    pbisSnapshot,
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formulario</CardTitle>
          <CardDescription>
            Paso 1: contexto (proyecto, sprint, historia de usuario). Paso 2: datos de la tarea (título, horas,
            actividad, fecha).
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

      {form.error ? <CopilotErrorAlert message={form.error} /> : null}
      {pbisSnapshot.error ? <CopilotErrorAlert message={pbisSnapshot.error} /> : null}

      {form.preview ? (
        <TimeLogPreviewCard
          preview={form.preview}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={form.loadingExecute}
          onConfirm={() => form.preview && void form.execute(form.preview)}
          onCancel={form.dismissPreview}
        />
      ) : null}

      <CopilotHistoryList entries={history} />
    </>
  );
}
