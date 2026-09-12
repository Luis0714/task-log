import { Info } from "lucide-react";

import { NoticeBanner } from "@/components/shared/notice-banner";
import { PullRequestEmpty } from "@/components/pull-requests/pull-request-empty";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";
import { PullRequestListSkeleton } from "@/components/pull-requests/pull-request-list-skeleton";
import { PULL_REQUEST_LIST_ERROR } from "@/lib/pull-requests/copy";
import type { PullRequestListItem } from "@/lib/pull-requests/types";

export type PullRequestListBodyProps = {
  items: readonly PullRequestListItem[];
  density: "compact" | "comfortable";
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
};

export function PullRequestListBody({
  items,
  density,
  loading,
  error,
  hasActiveFilters,
}: PullRequestListBodyProps) {
  if (loading) return <PullRequestListSkeleton />;

  if (error) {
    return (
      <NoticeBanner
        icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
      >
        <p>{error || PULL_REQUEST_LIST_ERROR}</p>
      </NoticeBanner>
    );
  }

  if (items.length === 0) {
    return <PullRequestEmpty hasActiveFilters={hasActiveFilters} />;
  }

  return <PullRequestList items={items} density={density} />;
}
