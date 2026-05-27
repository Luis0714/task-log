"use client";

import { CopilotHistoryList } from "@/components/copilot/copilot-history-list";
import { useCopilotHistory } from "@/hooks/use-copilot-history";

export function CopilotHistoryView() {
  const { history } = useCopilotHistory();

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Historial
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Revisa las ejecuciones recientes del registro de trabajo en este navegador.
        </p>
      </header>

      <CopilotHistoryList entries={history} />
    </div>
  );
}
