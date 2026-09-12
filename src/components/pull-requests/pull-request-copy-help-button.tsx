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

export type PullRequestCopyHelpButtonProps = CopyPullRequestHelpMessageInput & {
  className?: string;
};

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
    <span
      className={cn("relative z-10 inline-flex", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={copying}
              aria-label={COPY_PR_HELP_MESSAGE_LABEL}
              className="text-muted-foreground"
              onClick={() => void copyHelpMessage()}
            />
          }
        >
          <Send aria-hidden />
        </TooltipTrigger>
        <TooltipContent>{COPY_PR_HELP_MESSAGE_LABEL}</TooltipContent>
      </Tooltip>
    </span>
  );
}
