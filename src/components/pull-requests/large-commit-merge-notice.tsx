"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { NoticeBanner } from "@/components/shared/notice-banner";
import { LARGE_COMMIT_MERGE_MESSAGE } from "@/lib/pull-requests/copy";

export function LargeCommitMergeNotice() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <NoticeBanner
      className="border-amber-500/40 bg-amber-500/10"
      icon={<TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />}
      onDismiss={() => setVisible(false)}
    >
      <p>{LARGE_COMMIT_MERGE_MESSAGE}</p>
    </NoticeBanner>
  );
}
