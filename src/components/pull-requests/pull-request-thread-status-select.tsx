"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PULL_REQUEST_THREAD_STATUS_OPTIONS } from "@/lib/pull-requests/thread-status";
import type { PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<PullRequestThreadStatus, string> = {
  active: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  pending: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  fixed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  wontFix: "border-border bg-muted/60 text-muted-foreground",
  closed: "border-border bg-muted/60 text-muted-foreground",
  byDesign: "border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-300",
};

export type PullRequestThreadStatusSelectProps = {
  value: PullRequestThreadStatus;
  disabled?: boolean;
  onValueChange: (status: PullRequestThreadStatus) => void;
};

export function PullRequestThreadStatusSelect({
  value,
  disabled,
  onValueChange,
}: PullRequestThreadStatusSelectProps) {
  const selected =
    PULL_REQUEST_THREAD_STATUS_OPTIONS.find((option) => option.value === value) ??
    PULL_REQUEST_THREAD_STATUS_OPTIONS[0];

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onValueChange(next as PullRequestThreadStatus);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn("h-7 w-auto min-w-28 border", STATUS_TONE[value])}
        aria-label="Estado del comentario"
      >
        <SelectValue>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PULL_REQUEST_THREAD_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
