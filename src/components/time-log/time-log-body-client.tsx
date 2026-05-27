"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { TimeLogContextSection } from "@/components/time-log/time-log-context-section";
import { TimeLogCopilotLink, TimeLogForm } from "@/components/time-log/time-log-form";
import { TimeLogPreviewDialog } from "@/components/time-log/time-log-preview-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
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
  const { appendEntry } = useCopilotHistory();
  const form = useTimeLogForm({
    appendHistory: appendEntry,
    defaultProject,
    adoExecutionReady,
    serverBaseline,
    pbisSnapshot,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Form {...form.form}>
        <TimeLogContextSection form={form.form} catalog={form.catalog} />

        <Card className="min-w-0">
          <CardContent className="min-w-0 space-y-4">
            <TimeLogForm
              form={form.form}
              catalog={form.catalog}
              canSubmit={form.canSubmit}
              loading={form.loadingExecute}
              onSubmit={form.prepareSubmit}
            />
            <TimeLogCopilotLink />
          </CardContent>
        </Card>
      </Form>

      {form.error ? <CopilotErrorAlert message={form.error} /> : null}
      {pbisSnapshot.error ? <CopilotErrorAlert message={pbisSnapshot.error} /> : null}

      <TimeLogPreviewDialog
        open={Boolean(form.preview)}
        preview={form.preview}
        adoExecutionReady={adoExecutionReady}
        authMethod={authMethod}
        loading={form.loadingExecute}
        onConfirm={(payload) => void form.execute(payload)}
        onOpenChange={(open) => {
          if (!open) form.dismissPreview();
        }}
      />
    </div>
  );
}
