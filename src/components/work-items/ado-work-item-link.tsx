"use client";

import { ExternalLink } from "lucide-react";

import { useAdoWorkItemLinks } from "@/components/work-items/ado-work-item-links-context";
import { resolveAdoWorkItemEditUrl } from "@/lib/azure-devops/work-item-url";
import { cn } from "@/lib/utils";

export type AdoWorkItemLinkProps = {
  workItemId: number;
  project: string | null;
  label?: string;
  className?: string;
};

export function AdoWorkItemLink({
  workItemId,
  project,
  label,
  className,
}: AdoWorkItemLinkProps) {
  const { organization } = useAdoWorkItemLinks();
  const href = resolveAdoWorkItemEditUrl(organization, project, workItemId);
  const text = label ?? `#${workItemId}`;

  if (!href) {
    return (
      <span className={cn("text-muted-foreground font-mono text-xs tabular-nums", className)}>
        {text}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline",
        className,
      )}
      title={`Abrir ${text} en Azure DevOps`}
    >
      <span className="font-mono tabular-nums">{text}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}
