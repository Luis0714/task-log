"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { TimeLogContextSection } from "@/components/time-log/time-log-context-section";
import { TimeLogCopilotLink, TimeLogForm } from "@/components/time-log/time-log-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useTimeLogForm } from "@/hooks/use-time-log-form";
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type TimeLogBodyClientProps = {
  adoExecutionReady: boolean;
  defaultProject?: string | null;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
  isTaskCreationMode: boolean;
  initialWorkItemFilters?: Partial<WorkItemFilters>;
};

export function TimeLogBodyClient({
  adoExecutionReady,
  defaultProject = null,
  serverBaseline,
  pbisSnapshot,
  isTaskCreationMode,
  initialWorkItemFilters,
}: TimeLogBodyClientProps) {
  const { appendEntry } = useCopilotHistory();
  const form = useTimeLogForm({
    appendHistory: appendEntry,
    defaultProject,
    adoExecutionReady,
    serverBaseline,
    pbisSnapshot,
    isTaskCreationMode,
    initialWorkItemFilters,
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
              loading={form.loadingExecute}
              canSubmit={form.canSubmit}
              onSubmit={form.submit}
              lastSubmitted={form.lastSubmitted}
            />
            <TimeLogCopilotLink />
          </CardContent>
        </Card>
      </Form>

      {form.error ? <CopilotErrorAlert message={form.error} /> : null}
      {pbisSnapshot.error ? <CopilotErrorAlert message={pbisSnapshot.error} /> : null}
    </div>
  );
}