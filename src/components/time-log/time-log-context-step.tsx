"use client";

import { ArrowRight } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { AdoFiltersCollapsible } from "@/components/filters/ado-filters-collapsible";
import { TimeLogContextFields } from "@/components/filters/time-log-context-fields";
import { WorkItemFiltersPanel } from "@/components/filters/work-item-filters-panel";
import { PbiSelectField } from "@/components/time-log/fields/pbi-select-field";
import { Button } from "@/components/ui/button";
import { buildAdoFiltersSummary } from "@/lib/filters/summary";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogContextStepProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  onContinue: () => void;
};

export function TimeLogContextStep({ form, catalog, onContinue }: TimeLogContextStepProps) {
  const summary = buildAdoFiltersSummary({
    project: catalog.project || undefined,
    team: catalog.team || undefined,
    sprintLabel: catalog.selectedSprintLabel,
    workItemFilters: catalog.workItemFilters,
    filteredCount: catalog.workItemsFilteredCount,
    totalCount: catalog.workItemsTotalCount,
  });

  return (
    <div className="flex flex-col gap-4">
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
            onSearchChange={catalog.onWorkItemSearchChange}
            onAssigneeChange={catalog.onWorkItemAssigneeChange}
            onStateChange={catalog.onWorkItemStateChange}
            title="Filtros de historias de usuario"
          />
        ) : null}
      </AdoFiltersCollapsible>

      <PbiSelectField form={form} catalog={catalog} />

      <Button type="button" className="min-h-10 w-full sm:w-auto" onClick={onContinue}>
        Continuar a la tarea
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
