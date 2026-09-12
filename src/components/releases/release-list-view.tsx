"use client";

import { useState } from "react";

import { ReleaseApproveDialog } from "@/components/releases/release-approve-dialog";
import { ReleaseListLayout } from "@/components/releases/release-list-layout";
import { useReleaseList } from "@/hooks/releases/use-release-list";
import type { ReleaseApprovalTarget, ReleaseListItem, ReleaseStage } from "@/lib/releases/types";

export type ReleaseListViewProps = {
  title: string;
  project: string | null;
};

export function ReleaseListView({
  title,
  project,
}: ReleaseListViewProps) {
  const list = useReleaseList({ project });
  const [target, setTarget] = useState<ReleaseApprovalTarget | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const status = list.loading
    ? "Cargando releases..."
    : `${list.totalCount} releases`;

  function handleApprove(item: ReleaseListItem, stage: ReleaseStage) {
    if (!stage.approvalId) return;
    setTarget({
      approvalId: stage.approvalId,
      environmentName: stage.name,
      environmentShortName: stage.shortName,
      releaseName: item.name,
      createdBy: item.createdBy,
      branch: item.branch,
    });
  }

  return (
    <>
      <ReleaseListLayout
        title={title}
        description={status}
        search={list.search}
        tab={list.tab}
        filters={list.filters}
        filterOptions={list.filterOptions}
        filtersOpen={filtersOpen}
        activeFilterCount={list.activeFilterCount}
        definitionId={list.definitionId}
        definitions={list.definitions}
        items={list.items}
        totalCount={list.totalCount}
        pendingCount={list.pendingCount}
        loading={list.loading}
        error={list.error}
        hasActiveFilters={list.hasActiveFilters}
        disabled={list.pending}
        onSearchChange={list.setSearch}
        onTabChange={list.setTab}
        onFiltersChange={list.setFilters}
        onFiltersOpenChange={setFiltersOpen}
        onDefinitionChange={list.setDefinitionId}
        onApprove={handleApprove}
      />
      <ReleaseApproveDialog
        target={target}
        onConfirm={list.approve}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      />
    </>
  );
}
