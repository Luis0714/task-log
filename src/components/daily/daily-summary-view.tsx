"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { buildDailySummary } from "@/lib/dashboard/activity";
import type { DailySectionData } from "@/components/dashboard/daily/load-daily-section-data";

export type DailySummaryViewProps = DailySectionData;

export function DailySummaryView({
  inProgress,
  sprintName,
}: Readonly<DailySummaryViewProps>) {
  const { history } = useCopilotHistory();

  const dailySummary = buildDailySummary(inProgress, history);
  const regenerateDailySummary = () => buildDailySummary(inProgress, history);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5 xl:max-w-4xl">
      <PageHeader
        title="Resumen del daily"
        description={`Texto breve para compartir en tu reunión diaria del sprint "${sprintName}".`}
      />

      <DailySummaryCard
        key={dailySummary}
        summary={dailySummary}
        loading={false}
        onRegenerate={regenerateDailySummary}
        className="border-primary/20 ring-primary/10"
      />
    </div>
  );
}