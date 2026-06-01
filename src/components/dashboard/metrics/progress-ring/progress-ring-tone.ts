import type { ProgressRingTone } from "@/lib/dashboard/progress-ring/types";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<ProgressRingTone, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
  info: "text-[var(--chart-4)]",
  neutral: "text-muted-foreground",
};

export function progressRingToneClass(tone: ProgressRingTone, className?: string): string {
  return cn("size-3.5 shrink-0", TONE_CLASS[tone], className);
}
