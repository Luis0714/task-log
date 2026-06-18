"use client";

import { useMemo, type ComponentType } from "react";

import { WorkItemsSectionList } from "@/components/work-items/work-items-section-list";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import {
  WorkItemsAllSectionSkeleton,
  WorkItemsDevelopedSectionSkeleton,
  WorkItemsInProgressSectionSkeleton,
  WorkItemsUpcomingSectionSkeleton,
} from "@/components/skeletons/work-items-section-skeletons";
import { buildWorkItemsSectionLists } from "@/lib/work-items/build-work-items-section-lists";
import type { WorkItemsBaseSnapshot } from "@/lib/work-items/load-work-items-base";

export type WorkItemsSectionKey = "filteredItems" | "inProgress" | "upcoming" | "developed";

const SECTION_SKELETONS: Record<WorkItemsSectionKey, ComponentType> = {
  filteredItems: WorkItemsAllSectionSkeleton,
  inProgress: WorkItemsInProgressSectionSkeleton,
  upcoming: WorkItemsUpcomingSectionSkeleton,
  developed: WorkItemsDevelopedSectionSkeleton,
};

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
    description:
      "Historias asignadas al sprint actual, comprometidas y con el desarrollo en curso.",
    variant: "featured",
    emptyMessage: "No hay historias en progreso con los filtros actuales.",
  },
  upcoming: {
    title: "Historias pendientes",
    description:
      "Historias asignadas al sprint actual, comprometidas pero con el desarrollo aún sin iniciar.",
    variant: "compact",
    emptyMessage: "No hay historias pendientes con los filtros actuales.",
  },
  developed: {
    title: "Historias desarrolladas",
    description:
      "Historias asignadas al sprint actual con el desarrollo completado o en validación.",
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
  const { filters, isAssigneeNavigating } = useWorkItemsFiltersContext();

  const lists = useMemo(
    () => buildWorkItemsSectionLists(base, filters),
    [base, filters],
  );
  const copy = SECTION_COPY[section];

  if (isAssigneeNavigating) {
    const SkeletonComp = SECTION_SKELETONS[section];
    return <SkeletonComp />;
  }

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
