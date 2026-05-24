"use client";

import { ArrowRight } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  ProjectSelectField,
  SprintSelectField,
  TeamSelectField,
} from "@/components/time-log/fields/context-select-fields";
import { PbiSelectField } from "@/components/time-log/fields/pbi-select-field";
import { WorkItemFiltersPanel } from "@/components/time-log/work-item-filters-panel";
import { Button } from "@/components/ui/button";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export type TimeLogContextStepProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  onContinue: () => void;
};

export function TimeLogContextStep({ form, catalog, onContinue }: TimeLogContextStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProjectSelectField form={form} catalog={catalog} />
      <TeamSelectField form={form} catalog={catalog} />
      <SprintSelectField form={form} catalog={catalog} />

      {catalog.sprintPath ? (
        <WorkItemFiltersPanel
          filters={catalog.workItemFilters}
          states={catalog.workItemStates}
          filteredCount={catalog.workItemsFilteredCount}
          totalCount={catalog.workItemsTotalCount}
          disabled={catalog.catalogDisabled || catalog.pbisLoading}
          onSearchChange={catalog.onWorkItemSearchChange}
          onAssignedToMeChange={catalog.onWorkItemAssignedToMeChange}
          onStateChange={catalog.onWorkItemStateChange}
          title="Filtros de historias (PBI)"
        />
      ) : null}

      <PbiSelectField form={form} catalog={catalog} />

      <Button type="button" className="min-h-10 w-full sm:w-auto" onClick={onContinue}>
        Continuar a la tarea
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
