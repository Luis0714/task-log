"use client";

import { TruncatedTextTooltip } from "@/components/ui/truncated-text-tooltip";

export function ReviewTimesReviewerLine({ name }: Readonly<{ name: string }>) {
  return (
    <TruncatedTextTooltip text={`Revisor: ${name}`} className="text-xs font-bold" />
  );
}
