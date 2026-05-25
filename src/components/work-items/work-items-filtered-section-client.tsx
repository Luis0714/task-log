"use client";

import { useMemo } from "react";

import { WorkItemsSectionList } from "@/components/work-items/work-items-section-list";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import { buildWorkItemsSectionLists } from "@/lib/work-items/build-work-items-section-lists";
import type { WorkItemsBaseSnapshot } from "@/lib/work-items/load-work-items-base";

export type WorkItemsSectionKey = "filteredItems" | "inProgress" | "upcoming" | "developed";

const SECTION_COPY: Record<
  WorkItemsSectionKey,
  {
    title: string;
    description?: string;
    variant: "compact" | "featured";
    showHours?: boolean;
    emptyMessage: string;
  }
> = {
  filteredItems: {
    title: "Historias de usuario",
    description: "Todas las historias que coinciden con los filtros.",
    variant: "compact",
    showHours: true,
    emptyMessage: "No hay historias de usuario que coincidan con los filtros.",
  },
  inProgress: {
    title: "Historias en progreso",
    description: "Historias de usuario en estado Committed.",
    variant: "featured",
    emptyMessage: "No hay historias en Committed con los filtros actuales.",
  },
  upcoming: {
    title: "Próximas historias de usuario",
    description: "Qué deberías hacer después, ordenadas por prioridad.",
    variant: "compact",
    emptyMessage: "No hay historias en New o Approved con los filtros actuales.",
  },
  developed: {
    title: "Historias desarrolladas",
    description: "En QA, Review PO, Stage o Done.",
    variant: "compact",
    emptyMessage: "No hay historias desarrolladas con los filtros actuales.",
  },
};

export type WorkItemsFilteredSectionClientProps = {
  base: WorkItemsBaseSnapshot;
  section: WorkItemsSectionKey;
};

export function WorkItemsFilteredSectionClient({
  base,
  section,
}: WorkItemsFilteredSectionClientProps) {
  const { filters } = useWorkItemsFiltersContext();
  const lists = useMemo(
    () => buildWorkItemsSectionLists(base, filters),
    [base, filters],
  );
  const copy = SECTION_COPY[section];

  return (
    <WorkItemsSectionList
      title={copy.title}
      description={copy.description}
      items={lists[section]}
      variant={copy.variant}
      showHours={copy.showHours}
      emptyMessage={copy.emptyMessage}
    />
  );
}
