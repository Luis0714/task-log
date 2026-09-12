import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PullRequestSideSectionProps = {
  title: string;
  children: ReactNode;
  empty?: boolean;
  emptyLabel: string;
  className?: string;
};

export function PullRequestSideSection({
  title,
  children,
  empty,
  emptyLabel,
  className,
}: PullRequestSideSectionProps) {
  return (
    <section className={cn("rounded-xl border bg-card p-3", className)}>
      <h2 className="text-sm font-medium">{title}</h2>
      {empty ? (
        <p className="text-muted-foreground mt-2 text-xs">{emptyLabel}</p>
      ) : (
        <div className="mt-2">{children}</div>
      )}
    </section>
  );
}
