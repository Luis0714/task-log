"use client";

import { History } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Separator } from "@/components/ui/separator";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { PAGE_SEO } from "@/lib/seo/pages";
import { useHistoryFilter } from "@/hooks/use-history-filter";
import { CopilotHistoryList } from "@/components/copilot/copilot-history-list";
import { HistoryFilterChips } from "@/components/copilot/history-filter-chips";

export function CopilotHistoryView() {
  const { history } = useCopilotHistory();
  const { range, setRange, filtered } = useHistoryFilter(history);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4">
      <PageHeader
        title={PAGE_SEO.history.title}
        description={PAGE_SEO.history.description}
      />

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
