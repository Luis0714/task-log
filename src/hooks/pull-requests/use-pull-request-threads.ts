"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PULL_REQUEST_COMMENT_SUCCESS,
  PULL_REQUEST_REPLY_SUCCESS,
  PULL_REQUEST_THREAD_STATUS_SUCCESS,
} from "@/lib/pull-requests/copy";
import { threadCommentKey } from "@/lib/pull-requests/thread-line-key";
import type {
  CreatePullRequestThreadInput,
  PullRequestThread,
  PullRequestThreadStatus,
} from "@/lib/pull-requests/thread-types";
import { appToast } from "@/lib/toast";
import {
  createPullRequestThreadRequest,
  fetchPullRequestThreads,
  replyPullRequestThreadRequest,
  updatePullRequestThreadStatusRequest,
} from "@/services/ado/git-pull-request-threads.service";

export type UsePullRequestThreadsInput = {
  project: string;
  pullRequestId: number;
  repository: string;
};

type Snapshot = {
  key: string;
  threads: PullRequestThread[];
  error: string | null;
};

export function usePullRequestThreads({
  project,
  pullRequestId,
  repository,
}: UsePullRequestThreadsInput) {
  const projectName = project.trim();
  const repoName = repository.trim();
  const requestKey = `${projectName}|${repoName}|${pullRequestId}`;
  const [snapshot, setSnapshot] = useState<Snapshot>({
    key: "",
    threads: [],
    error: null,
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!projectName) return;
    const controller = new AbortController();
    void fetchPullRequestThreads(
      { project: projectName, pullRequestId, repository: repoName || undefined },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.ok) {
        if (result.error === "Cancelado") return;
        setSnapshot({ key: requestKey, threads: [], error: result.error });
        return;
      }
      setSnapshot({ key: requestKey, threads: result.threads, error: null });
    });
    return () => controller.abort();
  }, [projectName, pullRequestId, repoName, requestKey]);

  const query = useMemo(
    () => ({
      project: projectName,
      pullRequestId,
      repository: repoName || undefined,
    }),
    [projectName, pullRequestId, repoName],
  );

  const apply = useCallback(
    async (
      run: () => Promise<{ ok: true; threads: PullRequestThread[] } | { ok: false; error: string }>,
      successMessage: string,
    ) => {
      if (!projectName || pending) return false;
      setPending(true);
      try {
        const result = await run();
        if (!result.ok) {
          appToast.error(result.error);
          return false;
        }
        setSnapshot({ key: requestKey, threads: result.threads, error: null });
        appToast.success(successMessage);
        return true;
      } catch (cause) {
        appToast.fromError(cause, "No se pudo actualizar el comentario.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [pending, projectName, requestKey],
  );

  const createThread = useCallback(
    (input: CreatePullRequestThreadInput) =>
      apply(() => createPullRequestThreadRequest(query, input), PULL_REQUEST_COMMENT_SUCCESS),
    [apply, query],
  );

  const reply = useCallback(
    (threadId: number, content: string) => {
      const parentCommentId = snapshot.threads.find((thread) => thread.id === threadId)
        ?.comments[0]?.id;
      return apply(
        () => replyPullRequestThreadRequest(query, threadId, content, parentCommentId),
        PULL_REQUEST_REPLY_SUCCESS,
      );
    },
    [apply, query, snapshot.threads],
  );

  const setStatus = useCallback(
    (threadId: number, status: PullRequestThreadStatus) =>
      apply(
        () => updatePullRequestThreadStatusRequest(query, threadId, status),
        PULL_REQUEST_THREAD_STATUS_SUCCESS,
      ),
    [apply, query],
  );

  const loading = Boolean(projectName) && snapshot.key !== requestKey;
  const generalThreads = useMemo(
    () => snapshot.threads.filter((thread) => !thread.filePath),
    [snapshot.threads],
  );
  const threadsByLine = useMemo(() => {
    const map = new Map<string, PullRequestThread[]>();
    for (const thread of snapshot.threads) {
      const key = threadCommentKey(thread);
      if (!key) continue;
      const current = map.get(key) ?? [];
      current.push(thread);
      map.set(key, current);
    }
    return map;
  }, [snapshot.threads]);

  return {
    threads: snapshot.threads,
    generalThreads,
    threadsByLine,
    loading,
    pending,
    error: loading ? null : snapshot.error,
    createThread,
    reply,
    setStatus,
  };
}
