import { Info } from "lucide-react";

import { ReleaseEmpty } from "@/components/releases/release-empty";
import { ReleaseList } from "@/components/releases/release-list";
import { ReleaseListSkeleton } from "@/components/releases/release-list-skeleton";
import { NoticeBanner } from "@/components/shared/notice-banner";
import type { ReleaseListItem, ReleaseStage } from "@/lib/releases/types";

export type ReleaseListBodyProps = Readonly<{
  items: readonly ReleaseListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  disabled?: boolean;
  onApprove?: (item: ReleaseListItem, stage: ReleaseStage) => void;
}>;

export function ReleaseListBody({
  items,
  loading,
  error,
  hasActiveFilters,
  disabled,
  onApprove,
}: ReleaseListBodyProps) {
  if (loading) return <ReleaseListSkeleton />;

  if (error) {
    return (
      <NoticeBanner
        icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
      >
        <p>{error}</p>
      </NoticeBanner>
    );
  }

  if (items.length === 0) {
    return <ReleaseEmpty hasActiveFilters={hasActiveFilters} />;
  }

  return <ReleaseList items={items} disabled={disabled} onApprove={onApprove} />;
}
