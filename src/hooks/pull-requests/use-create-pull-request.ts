"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CREATE_PULL_REQUEST_SUCCESS_DESCRIPTION,
  createPullRequestSuccessTitle,
} from "@/lib/pull-requests/copy";
import type { CreatePullRequestBody } from "@/lib/schemas/git-pull-request";
import { createPullRequestRequest } from "@/services/ado/git-pull-request.service";
import { appToast } from "@/lib/toast";

export function useCreatePullRequest() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const create = useCallback(
    async (body: CreatePullRequestBody) => {
      if (pending) return;

      setPending(true);
      try {
        const result = await createPullRequestRequest(body);
        if (!result.ok) {
          appToast.error(result.error);
          return;
        }

        appToast.success(createPullRequestSuccessTitle(result.pullRequest.pullRequestId), {
          description: result.pullRequest.autoCompleteApplied
            ? `${CREATE_PULL_REQUEST_SUCCESS_DESCRIPTION} Se activó el autocompletado.`
            : CREATE_PULL_REQUEST_SUCCESS_DESCRIPTION,
        });
        router.push("/pull-requests");
      } catch (cause) {
        appToast.fromError(cause, "No se pudo crear el pull request.");
      } finally {
        setPending(false);
      }
    },
    [pending, router],
  );

  return { create, pending };
}
