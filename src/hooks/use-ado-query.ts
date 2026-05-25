"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AdoApiErrorPayload = {
  error?: string;
  detail?: string;
};

export type UseAdoQueryResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export type UseAdoQueryOptions<T> = {
  path: string;
  params?: Record<string, string | undefined>;
  enabled?: boolean;
  parse: (payload: unknown) => T;
  initialData: T;
  fallbackError: string;
  requireParams?: readonly string[];
};

/** Claves estables para `requireParams` (evita arrays literales en cada render). */
export const ADO_REQUIRE_PROJECT = ["project"] as const;
export const ADO_REQUIRE_PROJECT_TEAM = ["project", "team"] as const;
export const ADO_REQUIRE_PROJECT_SPRINT = ["project", "sprintPath"] as const;

const EMPTY_PARAMS: Record<string, string | undefined> = {};
const NO_REQUIRED_PARAMS: readonly string[] = [];

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value?.trim()) search.set(key, value.trim());
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function hasMissingParams(
  params: Record<string, string | undefined>,
  required: readonly string[],
): boolean {
  return required.some((key) => !params[key]?.trim());
}

function requiredParamsKey(required: readonly string[]): string {
  return required.join("|");
}

export function useAdoQuery<T>({
  path,
  params = EMPTY_PARAMS,
  enabled = true,
  parse,
  initialData,
  fallbackError,
  requireParams = NO_REQUIRED_PARAMS,
}: UseAdoQueryOptions<T>): UseAdoQueryResult<T> {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
  const refetch = useCallback(() => setRefetchTick((tick) => tick + 1), []);
  const parseRef = useRef(parse);
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    parseRef.current = parse;
    initialDataRef.current = initialData;
  }, [parse, initialData]);

  const stableParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, value?.trim() ?? ""]),
      ),
    [params],
  );

  const requiredKey = requiredParamsKey(requireParams);

  const paramsKey = useMemo(() => JSON.stringify(stableParams), [stableParams]);

  const requestKey = useMemo(
    () => JSON.stringify({ path, paramsKey, enabled, requiredKey, refetchTick }),
    [path, paramsKey, enabled, requiredKey, refetchTick],
  );

  useEffect(() => {
    if (!enabled || hasMissingParams(stableParams, requireParams)) {
      setData(initialDataRef.current);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(buildUrl(path, stableParams), { signal: controller.signal });
        const payload = (await res.json()) as AdoApiErrorPayload;

        if (!res.ok) {
          setData(initialDataRef.current);
          setError([payload.error, payload.detail].filter(Boolean).join(" — ") || fallbackError);
          return;
        }

        setData(parseRef.current(payload));
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setData(initialDataRef.current);
        setError(fallbackError);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [requestKey, fallbackError]);

  return { data, loading, error, refetch };
}
