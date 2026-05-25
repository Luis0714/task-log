import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintStatusOverview, WorkItemStatusCounts } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintStatusOverviewProps = {
  overview: SprintStatusOverview;
  loading?: boolean;
  className?: string;
};

type MetricVariant = "assigned" | "pending" | "completed";

type MinimalMetricCardProps = {
  label: string;
  value: number;
  variant: MetricVariant;
  loading?: boolean;
};

const variantStyles: Record<MetricVariant, { container: string; value: string }> = {
  assigned: {
    container:
      "border-border/60 bg-card text-card-foreground ring-1 ring-foreground/10",
    value: "text-foreground",
  },
  pending: {
    container: "border-border/60 bg-muted text-foreground",
    value: "text-foreground",
  },
  completed: {
    container: "border-primary/25 bg-primary/10 text-primary",
    value: "text-primary",
  },
};

function MinimalMetricCard({ label, value, variant, loading = false }: MinimalMetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex min-h-[88px] flex-col justify-between rounded-xl border px-4 py-3.5 transition-colors",
        styles.container,
      )}
    >
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-12" />
      ) : (
        <p
          className={cn(
            "font-heading text-3xl font-semibold tracking-tight tabular-nums",
            styles.value,
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
};

function progressPercent(counts: WorkItemStatusCounts): number {
  if (counts.assigned <= 0) return 0;
  return Math.round((counts.completed / counts.assigned) * 100);
}

type StatusRowProps = {
  title: string;
  counts: WorkItemStatusCounts;
  labels: {
    assigned: string;
    pending: string;
    completed: string;
  };
  progressSummary: (counts: WorkItemStatusCounts) => string;
  loading?: boolean;
};

function StatusRow({ title, counts, labels, progressSummary, loading = false }: StatusRowProps) {
  const percent = progressPercent(counts);
  const hasItems = counts.assigned > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </h3>
        {!loading && hasItems ? (
          <span className="text-primary font-heading text-sm font-semibold tabular-nums">
            {percent}%
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MinimalMetricCard
          label={labels.assigned}
          value={counts.assigned}
          variant="assigned"
          loading={loading}
        />
        <MinimalMetricCard
          label={labels.pending}
          value={counts.pending}
          variant="pending"
          loading={loading}
        />
        <MinimalMetricCard
          label={labels.completed}
          value={counts.completed}
          variant="completed"
          loading={loading}
        />
      </div>

      {loading ? (
        <Skeleton className="h-1.5 w-full rounded-full" />
      ) : (
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={counts.completed} max={Math.max(counts.assigned, 1)} />
          <p className="text-muted-foreground text-xs">
            {hasItems ? progressSummary(counts) : "Sin items asignados en este sprint"}
          </p>
        </div>
      )}
    </div>
  );
}

export function SprintStatusOverviewGrid({
  overview,
  loading = false,
  className,
}: SprintStatusOverviewProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <StatusRow
        title="Historias de usuario"
        counts={overview.userStories}
        labels={{
          assigned: "Asignadas",
          pending: "Pendientes",
          completed: "Desarrolladas",
        }}
        progressSummary={(counts) =>
          `${counts.completed} desarrolladas de ${counts.assigned} asignadas`
        }
        loading={loading}
      />
      <StatusRow
        title="Bugs"
        counts={overview.bugs}
        labels={{
          assigned: "Asignados",
          pending: "Pendientes",
          completed: "Atendidos",
        }}
        progressSummary={(counts) =>
          `${counts.completed} atendidos de ${counts.assigned} asignados`
        }
        loading={loading}
      />
    </div>
  );
}
