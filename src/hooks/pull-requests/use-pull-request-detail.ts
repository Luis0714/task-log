"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  PullRequestDetail,
  PullRequestMutation,
} from "@/lib/pull-requests/detail-types";
import {
  fetchPullRequestDetail,
  updatePullRequestRequest,
} from "@/services/ado/git-pull-request-detail.service";
import { appToast } from "@/lib/toast";

export type UsePullRequestDetailInput = {
  project: string | null;
  pullRequestId: number;
  repository?: string;
};

type DetailSnapshot = {
  key: string;
  detail: PullRequestDetail | null;
  error: string | null;
};

export function usePullRequestDetail({
  project,
  pullRequestId,
  repository,
}: UsePullRequestDetailInput) {
  const projectName = project?.trim() ?? "";
  const repoName = repository?.trim() ?? "";
  const requestKey = `${projectName}|${repoName}|${pullRequestId}`;
  const [snapshot, setSnapshot] = useState<DetailSnapshot>({
    key: "",
    detail: null,
    error: null,
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!projectName) return;

    const controller = new AbortController();
    void fetchPullRequestDetail(
      {
        project: projectName,
        pullRequestId,
        repository: repoName || undefined,
      },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setSnapshot({ key: requestKey, detail: result.detail, error: null });
        return;
      }
      if (result.error === "Cancelado") return;
      setSnapshot({ key: requestKey, detail: null, error: result.error });
    });

    return () => controller.abort();
  }, [projectName, pullRequestId, repoName, requestKey]);

  const mutate = useCallback(
    async (mutation: PullRequestMutation, successMessage: string) => {
      if (!projectName || pending) return false;
      setPending(true);
      try {
        const result = await updatePullRequestRequest(
          {
            project: projectName,
            pullRequestId,
            repository: repoName || undefined,
          },
          mutation,
        );
        if (!result.ok) {
          appToast.error(result.error);
          return false;
        }
        setSnapshot({ key: requestKey, detail: result.detail, error: null });
        appToast.success(successMessage);
        return true;
      } catch (cause) {
        appToast.fromError(cause, "No se pudo actualizar el pull request.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [pending, projectName, pullRequestId, repoName, requestKey],
  );

  const loading = Boolean(projectName) && snapshot.key !== requestKey;

  return {
    detail: loading ? null : snapshot.detail,
    loading,
    error: loading ? null : snapshot.error,
    pending,
    vote: (vote: number) => mutate({ action: "vote", vote }, "Voto registrado"),
    abandon: () => mutate({ action: "abandon" }, "Pull request abandonado"),
    reactivate: () => mutate({ action: "reactivate" }, "Pull request reactivado"),
    cancelAutoComplete: () =>
      mutate({ action: "cancelAutoComplete" }, "Autocompletado cancelado"),
  };
}
