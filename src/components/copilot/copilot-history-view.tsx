"use client";

import { History } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { useHistoryFilter } from "@/hooks/use-history-filter";
import { CopilotHistoryList } from "@/components/copilot/copilot-history-list";
import { HistoryFilterChips } from "@/components/copilot/history-filter-chips";

export function CopilotHistoryView() {
  const { history } = useCopilotHistory();
  const { range, setRange, filtered } = useHistoryFilter(history);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Historial
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Revisa las ejecuciones recientes del registro de trabajo en este navegador.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <History className="size-4" aria-hidden />
          Historial reciente
        </div>
        <HistoryFilterChips selected={range} onSelect={setRange} />
        <Separator />
      </section>

      <div className="border-border min-h-0 flex-1 overflow-y-auto rounded-lg border">
        <CopilotHistoryList entries={filtered} />
      </div>
    </div>
  );
}
