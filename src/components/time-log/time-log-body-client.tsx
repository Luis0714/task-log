"use client";

import { useCallback, useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { FeatureBadge } from "@/components/ui/feature-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TimeLogBulkForm } from "@/components/time-log/time-log-bulk-form";
import { TimeLogContextSection } from "@/components/time-log/time-log-context-section";
import { TimeLogCopilotLink, TimeLogForm } from "@/components/time-log/time-log-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useTimeLogForm } from "@/hooks/use-time-log-form";
import { useTimeLogViewUrl } from "@/hooks/time-log/use-time-log-view-url";
import type {
  TimeLogPbisSnapshot,
  TimeLogServerBaseline,
} from "@/lib/time-log/load-time-log-baseline";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import {
  TIME_LOG_VIEWS,
  type TimeLogViewId,
} from "@/lib/time-log/time-log-view";

const TIME_LOG_VIEW_ITEMS = [
  { value: TIME_LOG_VIEWS.individual, label: "Individual" },
  {
    value: TIME_LOG_VIEWS.multiple,
    label: "Múltiple",
    badge: <FeatureBadge variant="new" floating />,
  },
] satisfies readonly {
  value: TimeLogViewId;
  label: string;
  badge?: React.ReactNode;
}[];

export type TimeLogBodyClientProps = Readonly<{
  adoExecutionReady: boolean;
  defaultProject?: string | null;
  serverBaseline: TimeLogServerBaseline;
  pbisSnapshot: TimeLogPbisSnapshot;
  isTaskCreationMode: boolean;
  initialWorkItemFilters?: Partial<WorkItemFilters>;
}>;

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

  const { view, setView } = useTimeLogViewUrl();
  const [bulkHasData, setBulkHasData] = useState(false);
  const [pendingView, setPendingView] = useState<TimeLogViewId | null>(null);

  const requestViewChange = useCallback(
    (next: TimeLogViewId) => {
      if (next === view) return;
      // Sólo pedimos confirmación al salir de Múltiple con datos sin guardar.
      if (view === "multiple" && bulkHasData && next !== "multiple") {
        setPendingView(next);
        return;
      }
      setView(next);
    },
    [bulkHasData, setView, view],
  );

  const confirmViewChange = useCallback(() => {
    if (pendingView) {
      setView(pendingView);
      setPendingView(null);
    }
  }, [pendingView, setView]);

  const cancelViewChange = useCallback(() => {
    setPendingView(null);
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <SegmentedControl
        items={TIME_LOG_VIEW_ITEMS}
        value={view}
        onValueChange={requestViewChange}
        ariaLabel="Modo de registro de tiempo"
        fullWidth
        className="max-w-md"
      />

      <TimeLogContextSection
        {...(view === "individual" ? { form: form.form } : {})}
        catalog={form.catalog}
      />

      {view === "individual" ? (
        <Form {...form.form}>
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
      ) : (
        <TimeLogBulkForm
          catalog={form.catalog}
          appendHistory={appendEntry}
          isTaskCreationMode={isTaskCreationMode}
          onHasDataChange={setBulkHasData}
        />
      )}

      {form.error ? <CopilotErrorAlert message={form.error} /> : null}
      {pbisSnapshot.error ? <CopilotErrorAlert message={pbisSnapshot.error} /> : null}

      <Dialog
        open={pendingView !== null}
        onOpenChange={(open) => {
          if (!open) cancelViewChange();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Cambiar de modo?</DialogTitle>
            <DialogDescription>
              Tienes tareas con datos en el modo Múltiple que se perderán si
              cambias a Individual. ¿Quieres continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={confirmViewChange}>Sí, cambiar y descartar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
