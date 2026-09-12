import { Info } from "lucide-react";

import { NoticeBanner } from "@/components/shared/notice-banner";
import { NO_CHANGES_TO_MERGE_MESSAGE } from "@/lib/pull-requests/copy";

export function NoChangesToMergeNotice() {
  return (
    <NoticeBanner
      icon={<Info className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />}
    >
      <p>{NO_CHANGES_TO_MERGE_MESSAGE}</p>
    </NoticeBanner>
  );
}
