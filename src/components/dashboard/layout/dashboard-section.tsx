import { cn } from "@/lib/utils";

export type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm text-pretty">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}
