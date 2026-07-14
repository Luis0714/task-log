import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadHolidayDateKeysAroundToday } from "@/lib/hours/load-working-day-keys";
import { loadSprintItemsFilterMeta } from "@/lib/sprint-items/load-sprint-items-filter-meta";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import type { SprintItemsFilterMeta } from "@/lib/sprint-items/load-sprint-items-filter-meta";

export type SprintItemsPageMeta = {
  filterMeta: SprintItemsFilterMeta;
  nonWorkingDates: string[];
};

export const loadSprintItemsPageMeta = cache(async function loadSprintItemsPageMeta(
  kind: SprintItemsKind,
  catalog: AdoCatalogSnapshot,
): Promise<SprintItemsPageMeta> {
  if (!catalog.project || !catalog.team) {
    return { filterMeta: { members: [], states: [] }, nonWorkingDates: [] };
  }

  const [filterMeta, nonWorkingDates] = await Promise.all([
    loadSprintItemsFilterMeta(
      kind,
      catalog.project,
      catalog.team,
    ),
    loadHolidayDateKeysAroundToday(),
  ]);

  return { filterMeta, nonWorkingDates };
});
