"use client";

import { useCallback, useMemo } from "react";

import { DailySummaryCard } from "@/components/dashboard/daily/daily-summary-card";
import { useCopilotHistory } from "@/hooks/use-copilot-history";
import { buildDailySummary } from "@/lib/dashboard/activity";
import type { DashboardWorkItem } from "@/lib/dashboard/types";

export type DashboardDailySectionProps = {
  inProgress: DashboardWorkItem[];
  sprintName: string;
};

export function DashboardDailySection({ inProgress }: DashboardDailySectionProps) {
  const { history } = useCopilotHistory();

  const dailySummary = useMemo(
    () => buildDailySummary(inProgress, history),
    [history, inProgress],
  );

  const regenerateDailySummary = useCallback(
    () => buildDailySummary(inProgress, history),
    [history, inProgress],
  );

  return (
    <DailySummaryCard
      key={dailySummary}
      summary={dailySummary}
      loading={false}
      onRegenerate={regenerateDailySummary}
    />
  );
}
