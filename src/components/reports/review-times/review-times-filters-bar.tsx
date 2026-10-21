"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { FiltersBottomSheet } from "@/components/filters/filters-bottom-sheet";
import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { ReviewTimesChoiceFilters } from "@/components/reports/review-times/review-times-choice-filters";
import { ReviewTimesMonthFields } from "@/components/reports/review-times/review-times-month-fields";
import { useReviewTimesUrl } from "@/components/reports/review-times/review-times-url-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { selectionTriggerLabel, type PersonOption } from "@/lib/review-times/person-options";

export function ReviewTimesFiltersBar({
  repositoryOptions,
  currentUserId,
}: Readonly<{
  repositoryOptions: PersonOption[];
  currentUserId: string | null;
}>) {
  const url = useReviewTimesUrl();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const repositories = [...url.state.repositories];
  const localCount =
    url.state.reviewerIds.length +
    url.state.authorIds.length +
    url.state.statuses.length +
    (url.state.search.trim() ? 1 : 0);
  const mobileCount = localCount + repositories.length;

  const choices = {
    reviewerIds: url.state.reviewerIds,
    reviewerOptions: url.people.reviewerOptions,
    onReviewerIdsChange: url.setReviewerIds,
    currentUserId,
    authorIds: url.state.authorIds,
    authorOptions: url.people.authorOptions,
    onAuthorIdsChange: url.setAuthorIds,
    statuses: url.state.statuses,
    onStatusesChange: url.setStatuses,
    search: url.state.search,
    onSearchChange: url.setSearch,
    repositories,
    repositoryOptions,
    onRepositoriesChange: url.setRepositories,
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label>Periodo</Label>
          <ReviewTimesMonthFields
            monthKeys={url.state.monthKeys}
            onMonthKeysChange={url.setMonthKeys}
          />
        </div>
        <div className="hidden min-w-64 flex-1 md:block">
          <MultiCheckboxFilter
            id="review-times-repositories-desktop"
            label="Repositorios"
            options={repositoryOptions}
            selected={repositories}
            onSelectedChange={url.setRepositories}
            triggerLabel={selectionTriggerLabel(
              repositories,
              repositoryOptions,
              "Todos los repositorios",
              "repositorios",
            )}
            disabled={repositoryOptions.length === 0}
            searchable
            searchPlaceholder="Buscar repositorio…"
            emptySearchMessage="Sin repositorios que coincidan."
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          onClick={() => setSheetOpen(true)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtros{mobileCount > 0 ? ` (${mobileCount})` : ""}
        </Button>
      </div>

      <div className="hidden md:block">
        <Button type="button" variant="ghost" size="sm" onClick={() => setMoreOpen((open) => !open)}>
          Más filtros{localCount > 0 ? ` (${localCount})` : ""}
        </Button>
        {moreOpen ? (
          <div className="mt-3">
            <ReviewTimesChoiceFilters
              {...choices}
              idPrefix="review-times-desktop"
              showRepositories={false}
            />
          </div>
        ) : null}
      </div>

      <FiltersBottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filtros">
        <ReviewTimesChoiceFilters {...choices} idPrefix="review-times-sheet" showRepositories />
      </FiltersBottomSheet>
    </div>
  );
}
