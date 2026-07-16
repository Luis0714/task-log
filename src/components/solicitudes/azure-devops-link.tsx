"use client";

import { ExternalLink } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type AzureDevOpsLinkVariant = "icon" | "compact-with-id";

export type AzureDevOpsLinkProps = Readonly<{
  solicitud: SolicitudDto;
  variant: AzureDevOpsLinkVariant;
}>;

export function AzureDevOpsLink({ solicitud, variant }: AzureDevOpsLinkProps) {
  const ariaLabel = `Abrir novedad #${solicitud.id} en Azure DevOps`;
  const tooltipText = `Abrir novedad #${solicitud.id} en Azure DevOps`;

  if (variant === "compact-with-id") {
    return (
      <a
        href={solicitud.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
        title={tooltipText}
        aria-label={ariaLabel}
      >
        #{solicitud.id}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={solicitud.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center"
            aria-label={ariaLabel}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        }
      />
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
