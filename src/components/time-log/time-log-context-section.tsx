"use client";

import type { UseFormReturn } from "react-hook-form";

import { AdoFiltersCollapsible } from "@/components/filters/ado-filters-collapsible";
import { TimeLogContextFields } from "@/components/filters/time-log-context-fields";
import { WorkItemFiltersPanel } from "@/components/filters/work-item-filters-panel";
import { buildAdoFiltersSummary } from "@/lib/filters/summary";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogContextSectionProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
};

export function TimeLogContextSection({ form, catalog }: TimeLogContextSectionProps) {
  const summary = buildAdoFiltersSummary({
    project: catalog.project || undefined,
    team: catalog.team || undefined,
    sprintLabel: catalog.selectedSprintLabel,
    workItemFilters: catalog.workItemFilters,
    filteredCount: catalog.workItemsFilteredCount,
    totalCount: catalog.workItemsTotalCount,
  });

  return (
    <AdoFiltersCollapsible title="Contexto y filtros" summary={summary} defaultOpen={false}>
      <TimeLogContextFields form={form} catalog={catalog} />

      {catalog.sprintPath ? (
        <WorkItemFiltersPanel
          filters={catalog.workItemFilters}
          states={catalog.workItemStates}
          members={catalog.teamMembers}
          membersLoading={catalog.teamMembersLoading}
          membersError={catalog.teamMembersError}
          filteredCount={catalog.workItemsFilteredCount}
          totalCount={catalog.workItemsTotalCount}
          disabled={catalog.catalogDisabled || catalog.pbisLoading}
          hideSearch
          onSearchChange={catalog.onWorkItemSearchChange}
          onAssigneeChange={catalog.onWorkItemAssigneeChange}
          onStatesChange={catalog.onWorkItemStatesChange}
          title="Filtros de historias de usuario"
        />
      ) : null}
    </AdoFiltersCollapsible>
  );
}
