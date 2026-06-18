import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type PbiSummary = {
  exists: boolean;
  title?: string;
  areaPath?: string;
  iterationPath?: string;
  errorMessage?: string;
};

const PBI_FIELDS = ["System.Title", "System.AreaPath", "System.IterationPath"];

export async function fetchPbiSummary(
  auth: AdoCallerAuth,
  pbiId: number,
): Promise<PbiSummary> {
  const fields = PBI_FIELDS.join(",");
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${pbiId}?fields=${encodeURIComponent(fields)}&api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (res.status === 404 || res.status === 401 || res.status === 403) {
    return { exists: false, errorMessage: await res.text() };
  }
  if (!res.ok) {
    return { exists: false, errorMessage: (await res.text()).slice(0, 500) };
  }

  const data = (await res.json()) as {
    fields?: Record<string, string | undefined>;
  };
  const title = data.fields?.["System.Title"]?.trim();
  const areaPath = data.fields?.["System.AreaPath"]?.trim();
  const iterationPath = data.fields?.["System.IterationPath"]?.trim();

  if (!title) {
    return { exists: false, errorMessage: "La PBI no tiene título." };
  }

  return {
    exists: true,
    title,
    areaPath,
    iterationPath,
  };
}