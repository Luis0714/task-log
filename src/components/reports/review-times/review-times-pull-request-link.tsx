"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { buildAdoPullRequestUrl } from "@/lib/azure-devops/pull-request-url";

export function ReviewTimesPullRequestLink({
  organization,
  project,
  repository,
  pullRequestId,
  title,
  truncate = false,
}: Readonly<{
  organization: string;
  project: string;
  repository: string;
  pullRequestId: number;
  title: string;
  truncate?: boolean;
}>) {
  const href = buildAdoPullRequestUrl({
    organization,
    project,
    repository,
    pullRequestId,
  });
  const label = `#${pullRequestId} ${title}`;
  const className = cn("font-medium hover:underline", truncate && "block min-w-0 truncate");

  if (!href) {
    return truncate ? (
      <TruncatedTitle label={label} />
    ) : (
      <span className="font-medium">{label}</span>
    );
  }

  if (!truncate) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a href={href} target="_blank" rel="noreferrer" className={className}>
            {label}
          </a>
        }
      />
      <TooltipContent className="max-w-72 text-left">{label}</TooltipContent>
    </Tooltip>
  );
}

function TruncatedTitle({ label }: Readonly<{ label: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="block min-w-0 cursor-default truncate font-medium">{label}</span>
        }
      />
      <TooltipContent className="max-w-72 text-left">{label}</TooltipContent>
    </Tooltip>
  );
}
