"use client";

import { AdoContextSelectFields } from "@/components/filters/ado-context-select-fields";
import { AdoFiltersCollapsible } from "@/components/filters/ado-filters-collapsible";
import {
  WorkItemFiltersPanel,
  type WorkItemFiltersPanelProps,
} from "@/components/filters/work-item-filters-panel";
import { buildAdoFiltersSummary } from "@/lib/filters/summary";
import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { cn } from "@/lib/utils";

export type AdoFiltersSectionProps = {
  context: AdoContextSelectFieldsProps;
  workItems?: Omit<WorkItemFiltersPanelProps, "filters"> & {
    filters: WorkItemFilters;
  } | null;
  extra?: React.ReactNode;
  summaryExtra?: string;
  defaultOpen?: boolean;
  collapsibleTitle?: string;
  className?: string;
};

export function AdoFiltersSection({
  context,
  workItems = null,
  extra = null,
  summaryExtra,
  defaultOpen = false,
  collapsibleTitle = "Filtros",
  className,
}: AdoFiltersSectionProps) {
  const summary = buildAdoFiltersSummary({
    project: context.project || undefined,
    team: context.team || undefined,
    sprintLabel: context.selectedSprintLabel,
    workItemFilters: workItems?.filters,
    filteredCount: workItems?.filteredCount,
    totalCount: workItems?.totalCount,
    extraParts: summaryExtra ? [summaryExtra] : undefined,
  });

  return (
    <AdoFiltersCollapsible
      title={collapsibleTitle}
      summary={summary}
      defaultOpen={defaultOpen}
      className={className}
    >
      <AdoContextSelectFields {...context} />
      {workItems ? (
        <WorkItemFiltersPanel
          filters={workItems.filters}
          states={workItems.states}
          members={workItems.members}
          membersLoading={workItems.membersLoading}
          membersError={workItems.membersError}
          filteredCount={workItems.filteredCount}
          totalCount={workItems.totalCount}
          disabled={workItems.disabled}
          title={workItems.title}
          onSearchChange={workItems.onSearchChange}
          onAssigneeChange={workItems.onAssigneeChange}
          onStatesChange={workItems.onStatesChange}
          onSaveAsDefaults={workItems.onSaveAsDefaults}
        />
      ) : null}
      {extra}
    </AdoFiltersCollapsible>
  );
}

/** Variante sin colapsar (p. ej. dashboard con sección propia). */
export type AdoFiltersBlockProps = AdoFiltersSectionProps;

export function AdoFiltersBlock({
  context,
  workItems = null,
  className,
}: AdoFiltersBlockProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <AdoContextSelectFields {...context} />
      {workItems ? (
        <WorkItemFiltersPanel
          filters={workItems.filters}
          states={workItems.states}
          members={workItems.members}
          membersLoading={workItems.membersLoading}
          membersError={workItems.membersError}
          filteredCount={workItems.filteredCount}
          totalCount={workItems.totalCount}
          disabled={workItems.disabled}
          title={workItems.title}
          onSearchChange={workItems.onSearchChange}
          onAssigneeChange={workItems.onAssigneeChange}
          onStatesChange={workItems.onStatesChange}
          onSaveAsDefaults={workItems.onSaveAsDefaults}
        />
      ) : null}
    </div>
  );
}
