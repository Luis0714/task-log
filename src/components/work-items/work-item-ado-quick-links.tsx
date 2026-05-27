"use client";

import { AdoWorkItemLink } from "@/components/work-items/ado-work-item-link";
import { cn } from "@/lib/utils";

export type WorkItemAdoQuickLinkItem = {
  workItemId: number;
  label: string;
};

export type WorkItemAdoQuickLinksProps = {
  project: string | null;
  links: readonly WorkItemAdoQuickLinkItem[];
  className?: string;
};

export function WorkItemAdoQuickLinks({
  project,
  links,
  className,
}: WorkItemAdoQuickLinksProps) {
  if (links.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2",
        className,
      )}
    >
      <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        Azure DevOps
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <AdoWorkItemLink
            key={`${link.label}-${link.workItemId}`}
            workItemId={link.workItemId}
            project={project}
            label={link.label}
          />
        ))}
      </div>
    </div>
  );
}
