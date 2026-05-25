import "server-only";

import { cache } from "react";

import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { loadTimeLogFormMeta } from "@/lib/time-log/load-time-log-form-meta";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type TimeLogServerBaseline = {
  catalog: Awaited<ReturnType<typeof loadAdoCatalog>>;
} & Awaited<ReturnType<typeof loadTimeLogFormMeta>>;

export const loadTimeLogBaseline = cache(async function loadTimeLogBaseline(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
): Promise<TimeLogServerBaseline> {
  const catalog = await loadAdoCatalog(preferredProject, searchParams);
  const formMeta = await loadTimeLogFormMeta(catalog);
  return { catalog, ...formMeta };
});

export type TimeLogPbisSnapshot = {
  sprintPbis: AdoWorkItemOptionDto[];
  error: string | null;
};
