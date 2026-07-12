"use client";

import { useMemo } from "react";

import { AssigneeFilter } from "@/components/news-stories/assignee-filter";
import { PeriodInput } from "@/components/news-stories/period-input";
import { ReportedBody } from "@/components/news-stories/reported-body";
import { ReportedSectionHeader } from "@/components/news-stories/reported-section-header";
import { useReportedNewsStories } from "@/hooks/news-stories/use-reported-news-stories";
import { useReportedNewsFilters } from "@/hooks/news-stories/use-reported-news-filters";
import { describeReportedCount } from "@/components/news-stories/news-stories-reported-format";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";

export type NewsStoriesReportedSectionProps = Readonly<{
  /** Universo multi-scope sobre el que se buscan las novedades reportadas. */
  scopes: ReadonlyArray<ReportedNewsScope>;
}>;

export function NewsStoriesReportedSection({
  scopes,
}: NewsStoriesReportedSectionProps) {
  const projectReady = scopes.length > 0;
  const {
    mode,
    setMode,
    monthKey,
    setMonthKey,
    rangeFrom,
    setRangeFrom,
    rangeTo,
    setRangeTo,
    assigneeQuery,
    setAssigneeQuery,
    dateFilter,
  } = useReportedNewsFilters({ scopes });

  const { items, loading, error } = useReportedNewsStories({ scopes }, dateFilter);

  const normalizedQuery = assigneeQuery.trim().toLocaleLowerCase("es");
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      (item.assignedTo ?? "").toLocaleLowerCase("es").includes(normalizedQuery),
    );
  }, [items, normalizedQuery]);

  const showPeriodInput = mode !== "all";

  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-labelledby="reported-news-heading"
    >
      <ReportedSectionHeader
        mode={mode}
        onModeChange={setMode}
        pickerDisabled={!projectReady}
        loading={loading}
        subtitle={describeReportedCount(filteredItems.length, mode, monthKey)}
      />

      <div className="flex flex-wrap items-end gap-2">
        {showPeriodInput ? (
          <PeriodInput
            mode={mode}
            disabled={!projectReady}
            monthKey={monthKey}
            onMonthKeyChange={setMonthKey}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            onRangeFromChange={setRangeFrom}
            onRangeToChange={setRangeTo}
          />
        ) : null}
        <AssigneeFilter
          value={assigneeQuery}
          onChange={setAssigneeQuery}
          disabled={!projectReady}
        />
      </div>

      <div className="border-border border-t" />

      <ReportedBody
        items={filteredItems}
        loading={loading}
        error={error}
        projectReady={projectReady}
        mode={mode}
      />
    </section>
  );
}
