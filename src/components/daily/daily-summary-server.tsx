import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import {
  loadDailySectionData,
  type DailySectionData,
} from "@/components/dashboard/daily/load-daily-section-data";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type DailySummaryServerProps = {
  catalog: AdoCatalogSnapshot;
  children: (data: DailySectionData) => ReactNode;
};

export async function DailySummaryServer({
  catalog,
  children,
}: Readonly<DailySummaryServerProps>) {
  const result = await loadDailySectionData(catalog);
  if (!result.ok) return <CopilotErrorAlert message={result.error} />;
  return children(result.data);
}