"use client";

import { useMemo, useRef, useState } from "react";

import { filterReviewTimeRows } from "@/lib/review-times/filter-rows";
import { reviewTimeAverages } from "@/lib/review-times/averages";
import type { ReviewTimeLocalFilters, ReviewTimeStatus } from "@/lib/review-times/types";
import type { ReviewTimesResponse } from "@/lib/schemas/review-times";
import { fetchReviewTimes } from "@/services/ado/review-times.service";

export type ReviewTimesQueryState = {
  monthKey: string;
  repositories: string[];
};

function sameSelection(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

const EMPTY_FILTERS: ReviewTimeLocalFilters = {
  reviewerIds: [],
  authorIds: [],
  statuses: [],
  search: "",
};

export function useReviewTimesReport(project: string, initialMonthKey: string) {
  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [repositories, setRepositories] = useState<string[]>([]);
  const [applied, setApplied] = useState<ReviewTimesQueryState | null>(null);
  const [report, setReport] = useState<ReviewTimesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewTimeLocalFilters>(EMPTY_FILTERS);
  const request = useRef<AbortController | null>(null);

  const isStale =
    applied != null &&
    (applied.monthKey !== monthKey || !sameSelection(applied.repositories, repositories));

  const rows = useMemo(
    () => (report ? filterReviewTimeRows(report.rows, filters) : []),
    [filters, report],
  );
  const averages = useMemo(() => reviewTimeAverages(rows), [rows]);

  const generate = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);

    const query = { project, monthKey, repositories };
    const result = await fetchReviewTimes(query, controller.signal);
    if (controller.signal.aborted) return;

    setLoading(false);
    if (!result.ok) {
      setError(result.error || "No se pudieron calcular los tiempos de revisión.");
      return;
    }

    setReport(result.report);
    setApplied({ monthKey, repositories: [...repositories] });
  };

  const setReviewerIds = (reviewerIds: string[]) => {
    setFilters((current) => ({ ...current, reviewerIds }));
  };
  const setAuthorIds = (authorIds: string[]) => {
    setFilters((current) => ({ ...current, authorIds }));
  };
  const setStatuses = (statuses: ReviewTimeStatus[]) => {
    setFilters((current) => ({ ...current, statuses }));
  };
  const setSearch = (search: string) => {
    setFilters((current) => ({ ...current, search }));
  };

  return {
    monthKey,
    setMonthKey,
    repositories,
    setRepositories,
    filters,
    setReviewerIds,
    setAuthorIds,
    setStatuses,
    setSearch,
    report,
    rows,
    averages,
    loading,
    error,
    isStale,
    hasGenerated: applied != null,
    generate,
  };
}
