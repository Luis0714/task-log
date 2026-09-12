"use client";

import { useCallback, useState } from "react";

import { useAdoWorkItemLinks } from "@/components/work-items/ado-work-item-links-context";
import { resolveAdoPullRequestUrl } from "@/lib/azure-devops/pull-request-url";
import { copyTextToClipboard } from "@/lib/clipboard/copy-text";
import {
  COPY_PR_HELP_MESSAGE_ERROR,
  COPY_PR_HELP_MESSAGE_SUCCESS,
} from "@/lib/pull-requests/copy";
import { buildPullRequestDetailHref } from "@/lib/pull-requests/detail-path";
import { buildPullRequestHelpMessage } from "@/lib/pull-requests/help-message";
import { appToast } from "@/lib/toast";

export type CopyPullRequestHelpMessageInput = {
  pullRequestId: number;
  project: string;
  repository: string;
};

export function useCopyPullRequestHelpMessage({
  pullRequestId,
  project,
  repository,
}: CopyPullRequestHelpMessageInput) {
  const { organization } = useAdoWorkItemLinks();
  const [copying, setCopying] = useState(false);

  const copyHelpMessage = useCallback(async () => {
    if (copying) return;

    const adoUrl = resolveAdoPullRequestUrl(
      organization,
      project,
      repository,
      pullRequestId,
    );
    const fallbackHref = buildPullRequestDetailHref(pullRequestId, repository);
    const link = adoUrl ?? `${window.location.origin}${fallbackHref}`;
    const message = buildPullRequestHelpMessage({ link });

    setCopying(true);
    try {
      await copyTextToClipboard(message);
      appToast.success(COPY_PR_HELP_MESSAGE_SUCCESS);
    } catch {
      appToast.error(COPY_PR_HELP_MESSAGE_ERROR);
    } finally {
      setCopying(false);
    }
  }, [copying, organization, project, pullRequestId, repository]);

  return { copying, copyHelpMessage };
}
