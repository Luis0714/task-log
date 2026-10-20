"use client";

import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { FiltersBottomSheet } from "@/components/filters/filters-bottom-sheet";
import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { ReviewTimesChoiceFilters } from "@/components/reports/review-times/review-times-choice-filters";
import { ReviewTimesMonthFields } from "@/components/reports/review-times/review-times-month-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { selectionTriggerLabel, type PersonOption } from "@/lib/review-times/person-options";
import type { ReviewTimeStatus } from "@/lib/review-times/types";

export type ReviewTimesFiltersBarProps = {
  monthKey: string;
  onMonthKeyChange: (monthKey: string) => void;
  repositories: string[];
  repositoryOptions: PersonOption[];
  onRepositoriesChange: (values: string[]) => void;
  reviewerIds: readonly string[];
  reviewerOptions: PersonOption[];
  onReviewerIdsChange: (values: string[]) => void;
  currentUserId: string | null;
  authorIds: readonly string[];
  authorOptions: PersonOption[];
  onAuthorIdsChange: (values: string[]) => void;
  statuses: readonly ReviewTimeStatus[];
  onStatusesChange: (values: ReviewTimeStatus[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  isStale: boolean;
};

function localFilterCount(props: ReviewTimesFiltersBarProps): number {
  return (
    props.reviewerIds.length +
    props.authorIds.length +
    props.statuses.length +
    (props.search.trim() ? 1 : 0)
  );
}

export function ReviewTimesFiltersBar(props: Readonly<ReviewTimesFiltersBarProps>) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const localCount = localFilterCount(props);
  const mobileCount = localCount + props.repositories.length;
  let generateLabel = "Generar";
  if (props.generating) generateLabel = "Generando...";
  else if (props.isStale) generateLabel = "Actualizar";

  const choices = {
    reviewerIds: props.reviewerIds,
    reviewerOptions: props.reviewerOptions,
    onReviewerIdsChange: props.onReviewerIdsChange,
    currentUserId: props.currentUserId,
    authorIds: props.authorIds,
    authorOptions: props.authorOptions,
    onAuthorIdsChange: props.onAuthorIdsChange,
    statuses: props.statuses,
    onStatusesChange: props.onStatusesChange,
    search: props.search,
    onSearchChange: props.onSearchChange,
    repositories: props.repositories,
    repositoryOptions: props.repositoryOptions,
    onRepositoriesChange: props.onRepositoriesChange,
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label>Periodo</Label>
          <ReviewTimesMonthFields monthKey={props.monthKey} onMonthKeyChange={props.onMonthKeyChange} />
        </div>
        <div className="hidden min-w-64 flex-1 md:block">
          <MultiCheckboxFilter
            id="review-times-repositories-desktop"
            label="Repositorios"
            options={props.repositoryOptions}
            selected={props.repositories}
            onSelectedChange={props.onRepositoriesChange}
            triggerLabel={selectionTriggerLabel(
              props.repositories,
              props.repositoryOptions,
              "Todos los repositorios",
              "repositorios",
            )}
            disabled={props.repositoryOptions.length === 0}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros{mobileCount > 0 ? ` (${mobileCount})` : ""}
          </Button>
          <Button
            type="button"
            onClick={props.onGenerate}
            disabled={props.generating}
            variant={props.isStale ? "default" : "outline"}
          >
            {props.generating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
            {generateLabel}
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <Button type="button" variant="ghost" size="sm" onClick={() => setMoreOpen((open) => !open)}>
          Más filtros{localCount > 0 ? ` (${localCount})` : ""}
        </Button>
        {moreOpen ? (
          <div className="mt-3">
            <ReviewTimesChoiceFilters {...choices} idPrefix="review-times-desktop" showRepositories={false} />
          </div>
        ) : null}
      </div>

      <FiltersBottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filtros">
        <ReviewTimesChoiceFilters {...choices} idPrefix="review-times-sheet" showRepositories />
      </FiltersBottomSheet>
    </div>
  );
}
