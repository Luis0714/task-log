import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

type WiqlResponse = {
  workItems?: Array<{ id: number }>;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha civil YYYY-MM-DD para literales WIQL, o null si el valor no es una fecha. */
export function toWiqlDateLiteral(value: string | null | undefined): string | null {
  const key = value?.trim().slice(0, 10) ?? "";
  return DATE_KEY_PATTERN.test(key) ? key : null;
}

export function buildWiqlIdsQuery(
  conditions: readonly string[],
  orderBy?: string,
): string {
  const orderClause = orderBy ? ` ORDER BY ${orderBy}` : "";
  return `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(" AND ")}${orderClause}`;
}

export function adoListErrorMessage(
  res: Response,
  body: string,
  fallback: string,
): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}

export async function filterWorkItemIdsByCondition(
  auth: AdoCallerAuth,
  ids: readonly number[],
  condition: string,
  errorFallback: string,
): Promise<number[]> {
  if (ids.length === 0) return [];
  const idList = ids.join(", ");
  return runWiqlIdsQuery(
    auth,
    `SELECT [System.Id] FROM WorkItems WHERE [System.Id] IN (${idList}) AND (${condition})`,
    errorFallback,
  );
}

export type RunWiqlOptions = {
  /** Compara campos DateTime con hora exacta (permite rangos en instantes UTC). */
  timePrecision?: boolean;
};

export async function runWiqlIdsQuery(
  auth: AdoCallerAuth,
  query: string,
  errorFallback: string,
  { timePrecision = false }: RunWiqlOptions = {},
): Promise<number[]> {
  const precisionParam = timePrecision ? "&timePrecision=true" : "";
  const url = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1${precisionParam}`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(adoListErrorMessage(res, body, errorFallback));
  }

  const data = (await res.json()) as WiqlResponse;
  return (data.workItems ?? []).map((item) => item.id);
}
