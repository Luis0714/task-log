import { cn } from "@/lib/utils";

export type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Contenido opcional en el centro del header, entre el título y el action. */
  headerMiddle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  headerMiddle,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
        {/* 1 — Título: siempre ancla a la izquierda */}
        <div className="order-1 min-w-0 shrink space-y-0.5">
          <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm text-pretty">{description}</p>
          ) : null}
        </div>
        {/* 2 — Action (badge): comparte fila con el título en mobile, va al final en desktop */}
        {action ? (
          <div className="order-2 ml-auto shrink-0 sm:order-3">{action}</div>
        ) : null}
        {/* 3 — Barra central: en mobile ocupa fila propia (w-full), en desktop crece entre título y action */}
        {headerMiddle ? (
          <div className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
            {headerMiddle}
          </div>
        ) : null}
      </div>

      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}
