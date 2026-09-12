"use client";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useCopyPullRequestHelpMessage,
  type CopyPullRequestHelpMessageInput,
} from "@/hooks/pull-requests/use-copy-pull-request-help-message";
import { COPY_PR_HELP_MESSAGE_LABEL } from "@/lib/pull-requests/copy";
import { cn } from "@/lib/utils";

export type PullRequestCopyHelpButtonProps = Readonly<
  CopyPullRequestHelpMessageInput & {
    className?: string;
  }
>;

export function PullRequestCopyHelpButton({
  pullRequestId,
  project,
  repository,
  className,
}: PullRequestCopyHelpButtonProps) {
  const { copying, copyHelpMessage } = useCopyPullRequestHelpMessage({
    pullRequestId,
    project,
    repository,
  });

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={copying}
            aria-label={COPY_PR_HELP_MESSAGE_LABEL}
            className={cn("relative z-20 text-muted-foreground", className)}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void copyHelpMessage();
            }}
          />
        }
      >
        <Send aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{COPY_PR_HELP_MESSAGE_LABEL}</TooltipContent>
    </Tooltip>
  );
}
