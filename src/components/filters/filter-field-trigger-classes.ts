import { cn } from "@/lib/utils";

/** Alineado con `SelectTrigger` e `Input` del design system. */
export function filterFieldTriggerClassName(className?: string) {
  return cn(
    "flex h-8 w-full min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none select-none",
    "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "dark:bg-input/30 dark:hover:bg-input/50",
    className,
  );
}
