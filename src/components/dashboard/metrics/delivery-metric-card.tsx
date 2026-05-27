import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DeliveryMetricVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "accent"
  | "empty"
  | "bugOpen"
  | "destructive";

export type DeliveryMetricCardProps = {
  title: string;
  icon: LucideIcon;
  value: string;
  hint?: string;
  /** 0–100; omit for empty / story-points cards */
  progress?: number;
  variant?: DeliveryMetricVariant;
  highlight?: boolean;
  loading?: boolean;
  /** Sobrescribe el color del icono (p. ej. `text-bug-open`). */
  iconClassName?: string;
  className?: string;
};

type VariantStyles = {
  border: string;
  bg: string;
  icon: string;
  value: string;
  bar: string;
  ring: string;
};

type DeliveryMetricCardViewModel = {
  styles: VariantStyles;
  isEmpty: boolean;
  showProgress: boolean;
  showEmptyDash: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
};

const variantStyles: Record<DeliveryMetricVariant, VariantStyles> = {
  default: {
    border: "border-border/70",
    bg: "bg-card",
    icon: "text-primary",
    value: "text-foreground",
    bar: "bg-primary",
    ring: "ring-primary/20",
  },
  primary: {
    border: "border-primary/40",
    bg: "bg-primary/10 dark:bg-primary/12",
    icon: "text-primary",
    value: "text-foreground",
    bar: "bg-primary",
    ring: "ring-primary/30",
  },
  success: {
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    icon: "text-[var(--bug-attended)]",
    value: "text-[var(--bug-attended)]",
    bar: "bg-[var(--bug-attended)]",
    ring: "ring-emerald-500/25",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/8 dark:bg-amber-500/12",
    icon: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "ring-amber-500/25",
  },
  accent: {
    border: "border-accent/40",
    bg: "bg-accent/10 dark:bg-accent/12",
    icon: "text-accent",
    value: "text-accent",
    bar: "bg-accent",
    ring: "ring-accent/30",
  },
  empty: {
    border: "border-border/60",
    bg: "bg-muted/30",
    icon: "text-muted-foreground/70",
    value: "text-muted-foreground",
    bar: "bg-muted-foreground/30",
    ring: "ring-border/40",
  },
  bugOpen: {
    border: "border-bug-open/40",
    bg: "bg-bug-open/10 dark:bg-bug-open/12",
    icon: "text-bug-open",
    value: "text-foreground",
    bar: "bg-bug-open",
    ring: "ring-bug-open/30",
  },
  destructive: {
    border: "border-destructive/40",
    bg: "bg-destructive/8 dark:bg-destructive/12",
    icon: "text-destructive",
    value: "text-destructive",
    bar: "bg-destructive",
    ring: "ring-destructive/25",
  },
};

function ProgressTrack({
  progress,
  barClassName,
}: {
  progress: number;
  barClassName: string;
}) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-muted/80 h-1.5 w-full overflow-hidden rounded-full">
      <div
        className={cn("h-full rounded-full transition-all duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function EmptyProgressDash() {
  return (
    <div
      className={cn(
        "h-0.5 w-6 rounded-full",
        "bg-muted-foreground/25",
      )}
      aria-hidden
    />
  );
}

function buildDeliveryMetricCardViewModel({
  value,
  hint,
  progress,
  variant,
  loading,
}: Pick<DeliveryMetricCardProps, "value" | "hint" | "progress" | "variant" | "loading">): DeliveryMetricCardViewModel {
  const resolvedVariant = variant ?? "default";
  const isEmpty = resolvedVariant === "empty";

  return {
    styles: variantStyles[resolvedVariant],
    isEmpty,
    showProgress: progress !== undefined && !loading,
    showEmptyDash: isEmpty && progress === undefined && !loading,
    primaryLabel: value,
    secondaryLabel: hint,
  };
}

function DeliveryMetricCardSkeleton() {
  return (
    <div className="flex min-h-full min-w-0 flex-col gap-2 p-2.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3.5 shrink-0 rounded-sm" />
          <Skeleton className="h-3 min-w-0 flex-1" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="mt-auto flex flex-col gap-1 pt-0.5">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-2.5 w-10" />
      </div>
    </div>
  );
}

export function DeliveryMetricCard({
  title,
  icon: Icon,
  value,
  hint,
  progress,
  variant = "default",
  highlight = false,
  loading = false,
  iconClassName,
  className,
}: DeliveryMetricCardProps) {
  const viewModel = buildDeliveryMetricCardViewModel({
    value,
    hint,
    progress,
    variant,
    loading,
  });

  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col rounded-lg border transition-colors",
        "gap-1.5 p-2.5 lg:gap-2 lg:p-3",
        viewModel.styles.border,
        viewModel.styles.bg,
        highlight && ["shadow-sm ring-1", viewModel.styles.ring],
        className,
      )}
    >
      {loading ? (
        <DeliveryMetricCardSkeleton />
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-1.5">
            <Icon
              className={cn("size-3.5 shrink-0", viewModel.styles.icon, iconClassName)}
              aria-hidden
            />
            <h3 className="text-foreground min-w-0 flex-1 text-[10px] font-medium leading-none sm:text-[11px]">
              {title}
            </h3>
          </div>

          <p
            className={cn(
              "font-heading text-xl font-semibold leading-none tracking-tight tabular-nums",
              "lg:text-2xl",
              viewModel.isEmpty && !hint ? "text-muted-foreground" : viewModel.styles.value,
            )}
          >
            {viewModel.primaryLabel}
          </p>

          {viewModel.showProgress || viewModel.showEmptyDash || viewModel.secondaryLabel ? (
            <div className="mt-auto flex flex-col gap-1 pt-0.5">
              {viewModel.showProgress ? (
                <ProgressTrack progress={progress} barClassName={viewModel.styles.bar} />
              ) : null}
              {viewModel.showEmptyDash ? <EmptyProgressDash /> : null}
              {viewModel.secondaryLabel ? (
                <p className="text-muted-foreground text-[10px] leading-tight tabular-nums">
                  {viewModel.secondaryLabel}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
