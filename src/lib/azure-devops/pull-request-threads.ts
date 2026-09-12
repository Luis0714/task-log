import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";
import type {
  CreatePullRequestThreadInput,
  PullRequestThreadStatus,
} from "@/lib/pull-requests/thread-types";
import { toAdoThreadFilePath } from "@/lib/pull-requests/thread-line-key";

const API_VERSION = "7.1";

export type AdoPullRequestThreadIdentity = {
  id?: string;
  displayName?: string;
};

export type AdoPullRequestThreadComment = {
  id?: number;
  parentCommentId?: number;
  content?: string;
  publishedDate?: string;
  lastUpdatedDate?: string;
  commentType?: string | number;
  isDeleted?: boolean;
  author?: AdoPullRequestThreadIdentity;
};

export type AdoPullRequestThreadPosition = {
  line?: number;
  offset?: number;
};

export type AdoPullRequestThreadContext = {
  filePath?: string;
  rightFileStart?: AdoPullRequestThreadPosition;
  rightFileEnd?: AdoPullRequestThreadPosition;
  leftFileStart?: AdoPullRequestThreadPosition;
  leftFileEnd?: AdoPullRequestThreadPosition;
};

export type AdoPullRequestThread = {
  id?: number;
  status?: string | number;
  isDeleted?: boolean;
  comments?: AdoPullRequestThreadComment[];
  threadContext?: AdoPullRequestThreadContext | null;
};

async function readAdoError(res: Response, fallback: string): Promise<string> {
  const body = await res.text();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    const message = parsed.message?.trim();
    if (message) return message;
  } catch {
    /* cuerpo no JSON */
  }
  return adoListErrorMessage(res, body, fallback);
}

function threadsBase(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): string {
  return `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/pullRequests/${pullRequestId}/threads`;
}

export async function listAdoPullRequestThreads(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
): Promise<AdoPullRequestThread[]> {
  const url = `${threadsBase(auth, repositoryId, pullRequestId)}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron cargar los comentarios."));
  }
  const payload = (await res.json()) as { value?: AdoPullRequestThread[] };
  return payload.value ?? [];
}

function threadContextFromInput(
  input: CreatePullRequestThreadInput,
): AdoPullRequestThreadContext | undefined {
  if (!input.filePath?.trim()) return undefined;
  const filePath = toAdoThreadFilePath(input.filePath);
  if (!filePath) return undefined;
  if (!input.line || !input.lineSide) return { filePath };

  const position = { line: input.line, offset: 1 };
  if (input.lineSide === "left") {
    return {
      filePath,
      leftFileStart: position,
      leftFileEnd: position,
    };
  }
  return {
    filePath,
    rightFileStart: position,
    rightFileEnd: position,
  };
}

export async function createAdoPullRequestThread(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  input: CreatePullRequestThreadInput,
): Promise<void> {
  const body: Record<string, unknown> = {
    comments: [
      {
        parentCommentId: 0,
        content: input.content,
        commentType: "text",
      },
    ],
    status: "active",
  };
  const threadContext = threadContextFromInput(input);
  if (threadContext) body.threadContext = threadContext;

  const url = `${threadsBase(auth, repositoryId, pullRequestId)}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo publicar el comentario."));
  }
}

export async function replyAdoPullRequestThread(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  threadId: number,
  content: string,
  parentCommentId: number,
): Promise<void> {
  const url = `${threadsBase(auth, repositoryId, pullRequestId)}/${threadId}/comments?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      parentCommentId,
      commentType: "text",
    }),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo responder el comentario."));
  }
}

export async function patchAdoPullRequestThreadStatus(
  auth: AdoCallerAuth,
  repositoryId: string,
  pullRequestId: number,
  threadId: number,
  status: PullRequestThreadStatus,
): Promise<void> {
  const url = `${threadsBase(auth, repositoryId, pullRequestId)}/${threadId}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo cambiar el estado del comentario."));
  }
}
