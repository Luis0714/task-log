"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import type { TimeLogServerBaseline } from "@/lib/time-log/load-time-log-baseline";

export type TimeLogPageShellProps = {
  serverBaseline: TimeLogServerBaseline;
  adoExecutionReady: boolean;
  notReadyMessage: string;
  children: ReactNode;
};

export function TimeLogPageShell({
  serverBaseline,
  adoExecutionReady,
  notReadyMessage,
  children,
}: TimeLogPageShellProps) {
  const { catalog } = serverBaseline;

  const catalogError =
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null;

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

      {!adoExecutionReady ? <CopilotErrorAlert message={notReadyMessage} /> : null}
      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {children}
    </div>
  );
}
