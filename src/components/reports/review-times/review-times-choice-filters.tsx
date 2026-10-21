"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectionTriggerLabel, type PersonOption } from "@/lib/review-times/person-options";
import { REVIEW_TIME_STATUSES, type ReviewTimeStatus } from "@/lib/review-times/types";

const STATUS_OPTIONS: PersonOption[] = [
  { value: "pending_review", label: "Pendiente de revisión" },
  { value: "reviewed", label: "Revisado sin aprobar" },
  { value: "approved", label: "Aprobado" },
];

export type ReviewTimesChoiceFiltersProps = {
  idPrefix: string;
  repositories: readonly string[];
  repositoryOptions: PersonOption[];
  showRepositories: boolean;
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
};

export function ReviewTimesChoiceFilters({
  repositories,
  repositoryOptions,
  showRepositories,
  onRepositoriesChange,
  reviewerIds,
  reviewerOptions,
  onReviewerIdsChange,
  currentUserId,
  authorIds,
  authorOptions,
  onAuthorIdsChange,
  statuses,
  onStatusesChange,
  search,
  onSearchChange,
  idPrefix,
}: Readonly<ReviewTimesChoiceFiltersProps>) {
  const youPreset =
    currentUserId && reviewerOptions.some((option) => option.value === currentUserId)
      ? [
          {
            label: "Tú",
            active: reviewerIds.length === 1 && reviewerIds[0] === currentUserId,
            onSelect: () => onReviewerIdsChange([currentUserId]),
          },
        ]
      : [];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {showRepositories ? (
        <MultiCheckboxFilter
          id={`${idPrefix}-repositories`}
          label="Repositorios"
          options={repositoryOptions}
          selected={[...repositories]}
          onSelectedChange={onRepositoriesChange}
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
      ) : null}
      <MultiCheckboxFilter
        id={`${idPrefix}-reviewers`}
        label="Revisores"
        options={reviewerOptions}
        selected={[...reviewerIds]}
        onSelectedChange={onReviewerIdsChange}
        triggerLabel={selectionTriggerLabel(reviewerIds, reviewerOptions, "Todos los revisores", "revisores")}
        presets={youPreset}
        disabled={reviewerOptions.length === 0}
      />
      <MultiCheckboxFilter
        id={`${idPrefix}-authors`}
        label="Autores"
        options={authorOptions}
        selected={[...authorIds]}
        onSelectedChange={onAuthorIdsChange}
        triggerLabel={selectionTriggerLabel(authorIds, authorOptions, "Todos los autores", "autores")}
        disabled={authorOptions.length === 0}
      />
      <MultiCheckboxFilter
        id={`${idPrefix}-status`}
        label="Estado"
        options={STATUS_OPTIONS}
        selected={[...statuses]}
        onSelectedChange={(values) =>
          onStatusesChange(values.filter((value): value is ReviewTimeStatus =>
            REVIEW_TIME_STATUSES.includes(value as ReviewTimeStatus),
          ))
        }
        triggerLabel={selectionTriggerLabel(statuses, STATUS_OPTIONS, "Todos los estados", "estados")}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-search`}>Buscar</Label>
        <Input
          id={`${idPrefix}-search`}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Número o título"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
