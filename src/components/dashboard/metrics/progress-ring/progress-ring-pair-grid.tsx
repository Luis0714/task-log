import { cn } from "@/lib/utils";

export const PROGRESS_RING_PAIR_GRID_CLASS =
  "grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-4";

export const PROGRESS_RING_PAIR_CELL_CLASS = "min-w-0 h-full w-full";

export type ProgressRingPairGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function ProgressRingPairGrid({ children, className }: ProgressRingPairGridProps) {
  return <div className={cn(PROGRESS_RING_PAIR_GRID_CLASS, className)}>{children}</div>;
}
