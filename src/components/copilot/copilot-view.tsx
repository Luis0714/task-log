"use client";

import type { ReactNode } from "react";

import { CopilotClarificationCard } from "@/components/copilot/copilot-clarification-card";
import { CopilotCreateTasksForm } from "@/components/copilot/copilot-create-tasks-form";
import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { CopilotInput } from "@/components/copilot/copilot-input";
import { CopilotLogWorkForm } from "@/components/copilot/copilot-log-work-form";
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
import type { SprintContext } from "@/lib/agent";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import { cn } from "@/lib/utils";

export type CopilotViewProps = {
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  dailySection?: ReactNode;
  sprintContext?: SprintContext;
};

export function CopilotView({
  adoExecutionReady,
  authMethod,
  dailySection,
  sprintContext,
}: Readonly<CopilotViewProps>) {
  const { appendEntry } = useCopilotHistory();
  const copilot = useCopilot({
    appendHistory: appendEntry,
    sprintContext,
  });

  const preview = copilot.preview;
  const createPreview = preview?.action === "create_tasks_batch" ? preview : null;
  const logPreview = preview?.action === "log_work_batch" ? preview : null;
  const clarification =
    preview?.action === "needs_clarification" &&
    preview.candidates &&
    preview.candidates.length > 0
      ? preview
      : null;
  const resultMessage =
    preview && preview.action !== "log_work_batch" &&
    preview.action !== "create_tasks_batch" &&
    !clarification
      ? preview
      : null;

  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5 xl:max-w-4xl",
      )}
    >
      <PageHeader
        title="Copiloto IA"
        description="Cuéntame qué hiciste en lenguaje natural. Yo lo organizo, te pregunto lo que falte y tú confirmas."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tu mensaje</CardTitle>
          <CardDescription>
            Ej: "Hoy 2h en el bug del login y 1h revisando el PR de María".
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

      {createPreview && sprintContext && (
        <CopilotCreateTasksForm
          preview={createPreview}
          sprintPath={sprintContext.sprintPath}
          team={sprintContext.team}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={copilot.loadingExecute}
          onConfirm={(tasks) => void copilot.executeCreateTasks(tasks)}
          onCancel={copilot.dismissPreview}
        />
      )}

      {logPreview && (
        <CopilotLogWorkForm
          preview={logPreview}
          adoExecutionReady={adoExecutionReady}
          authMethod={authMethod}
          loading={copilot.loadingExecute}
          onConfirm={(items) => void copilot.execute(items)}
          onCancel={copilot.dismissPreview}
        />
      )}

      {clarification && (
        <CopilotClarificationCard
          preview={clarification}
          loading={copilot.loadingPreview}
          onPickPbi={(id) => void copilot.refineWithPbiId(id)}
          onCancel={copilot.dismissPreview}
        />
      )}

      {resultMessage && <CopilotResultMessage preview={resultMessage} />}
    </div>
  );
}