import { DeliveryMetricCardSkeleton } from "@/components/dashboard/metrics/delivery-metric-card-skeleton";
import {
  buildDeliveryMetricCardViewModel,
} from "@/components/dashboard/metrics/delivery-metric-card.viewmodel";
import { DeliveryMetricEmptyProgressDash } from "@/components/dashboard/metrics/delivery-metric-empty-progress-dash";
import { DeliveryMetricProgressTrack } from "@/components/dashboard/metrics/delivery-metric-progress-track";
import type { DeliveryMetricCardProps } from "@/components/dashboard/metrics/delivery-metric-card.types";
import { cn } from "@/lib/utils";

export type { DeliveryMetricCardProps, DeliveryMetricVariant } from "@/components/dashboard/metrics/delivery-metric-card.types";

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
  const progressValue = progress ?? 0;
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
                <DeliveryMetricProgressTrack
                  progress={progressValue}
                  barClassName={viewModel.styles.bar}
                />
              ) : null}
              {viewModel.showEmptyDash ? <DeliveryMetricEmptyProgressDash /> : null}
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
