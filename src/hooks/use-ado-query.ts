"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AdoApiErrorPayload = {
  error?: string;
  detail?: string;
};

export type UseAdoQueryResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export type UseAdoQueryOptions<T> = {
  path: string;
  params?: Record<string, string | undefined>;
  enabled?: boolean;
  parse: (payload: unknown) => T;
  initialData: T;
  fallbackError: string;
  requireParams?: string[];
};

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
  required: string[],
): boolean {
  return required.some((key) => !params[key]?.trim());
}

export function useAdoQuery<T>({
  path,
  params = {},
  enabled = true,
  parse,
  initialData,
  fallbackError,
  requireParams = [],
}: UseAdoQueryOptions<T>): UseAdoQueryResult<T> {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parseRef = useRef(parse);
  const initialDataRef = useRef(initialData);
  parseRef.current = parse;
  initialDataRef.current = initialData;

  const stableParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, value?.trim() ?? ""]),
      ),
    [params],
  );

  const requestKey = useMemo(
    () => JSON.stringify({ path, stableParams, enabled, requireParams }),
    [path, stableParams, enabled, requireParams],
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

  return { data, loading, error };
}
