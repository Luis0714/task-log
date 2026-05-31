import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  meta,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        ) : null}
        {meta ? <div className="pt-1.5">{meta}</div> : null}
      </div>
      {action ? (
        <div className="shrink-0 self-start sm:self-center">{action}</div>
      ) : null}
    </header>
  );
}
