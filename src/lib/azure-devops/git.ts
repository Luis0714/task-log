import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";
import type { GitCommit, GitFileChange, GitFileChangeKind } from "@/lib/git/changeset";
import { isGitFilePath } from "@/lib/git/is-git-file-path";

const API_VERSION = "7.1";
const COMMIT_TOP = 200;
const DIFF_TOP = 500;

type AdoGitRepository = {
  id?: string;
  name?: string;
};

type AdoGitCommit = {
  commitId?: string;
  comment?: string;
  author?: { name?: string; date?: string };
};

type AdoGitChange = {
  changeType?: string | number;
  item?: { path?: string; isFolder?: boolean; gitObjectType?: string };
  sourceServerItem?: string;
};

type AdoGitDiffs = {
  changes?: AdoGitChange[];
  commonCommit?: string;
  targetCommit?: string;
  aheadCount?: number;
};

export type BranchFileDiff = {
  files: GitFileChange[];
  commonCommit: string | null;
  sourceCommit: string | null;
};

type AdoGitItem = {
  content?: string;
  isFolder?: boolean;
  gitObjectType?: string;
  objectId?: string;
  path?: string;
  contentMetadata?: { isBinary?: boolean };
};

function parseAdoGitItem(body: string): AdoGitItem | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const item = JSON.parse(trimmed) as AdoGitItem;
    if (item.gitObjectType || item.objectId || item.contentMetadata || item.isFolder != null) {
      return item;
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeGitBranchName(value: string): string {
  return value.trim().replace(/^refs\/heads\//, "");
}

export function normalizeGitPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function readAdoError(res: Response, fallback: string): Promise<string> {
  const body = await res.text();
  return adoListErrorMessage(res, body, fallback);
}

export type AdoGitRepositoryOption = {
  id: string;
  name: string;
};

export async function listGitRepositories(
  auth: AdoCallerAuth,
): Promise<AdoGitRepositoryOption[]> {
  const url = `${adoProjectBase(auth)}/_apis/git/repositories?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron listar los repositorios."));
  }

  const payload = (await res.json()) as { value?: AdoGitRepository[] };
  return (payload.value ?? [])
    .filter((item): item is AdoGitRepository & { id: string; name: string } =>
      Boolean(item.id && item.name),
    )
    .map((item) => ({ id: item.id, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

export async function resolveGitRepositoryId(
  auth: AdoCallerAuth,
  repository: string,
): Promise<string> {
  const name = repository.trim();
  const base = `${adoProjectBase(auth)}/_apis/git/repositories`;
  const direct = await adoFetch(
    auth,
    `${base}/${encodeURIComponent(name)}?api-version=${API_VERSION}`,
  );

  if (direct.ok) {
    const data = (await direct.json()) as AdoGitRepository;
    if (data.id) return data.id;
  }

  const list = await adoFetch(auth, `${base}?api-version=${API_VERSION}`);
  if (!list.ok) {
    throw new Error(await readAdoError(list, "No se pudieron listar los repositorios."));
  }

  const payload = (await list.json()) as { value?: AdoGitRepository[] };
  const match = (payload.value ?? []).find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );
  if (!match?.id) {
    throw new Error("No se encontró el repositorio en Azure DevOps.");
  }
  return match.id;
}

function mapCommit(commit: AdoGitCommit): GitCommit | null {
  const id = commit.commitId?.trim();
  if (!id) return null;
  const message = (commit.comment ?? "").split("\n")[0]?.trim() || "(sin mensaje)";
  return {
    id,
    shortId: id.slice(0, 8),
    message,
    author: commit.author?.name?.trim() || "Desconocido",
    authoredAt: commit.author?.date || new Date().toISOString(),
  };
}

function mapChangeKind(changeType: string | number | undefined): GitFileChangeKind {
  const raw = String(changeType ?? "").toLowerCase();
  if (raw.includes("add") || raw === "1") return "added";
  if (raw.includes("delete") || raw === "16") return "deleted";
  return "modified";
}

function isAdoFolderChange(change: AdoGitChange): boolean {
  const item = change.item;
  if (item?.isFolder || item?.gitObjectType === "tree") return true;
  const path = item?.path?.trim() || change.sourceServerItem?.trim() || "";
  return !isGitFilePath(path);
}

function mapFileChange(change: AdoGitChange): GitFileChange | null {
  if (isAdoFolderChange(change)) return null;
  const path = change.item?.path?.trim() || change.sourceServerItem?.trim();
  if (!path) return null;
  return {
    path: path.replace(/^\//, ""),
    kind: mapChangeKind(change.changeType),
    additions: 0,
    deletions: 0,
    hunks: [],
  };
}

function toBranchVersion(branch: string, qualified = false) {
  const name = normalizeGitBranchName(branch);
  return {
    version: qualified ? `refs/heads/${name}` : name,
    versionType: "branch" as const,
  };
}

async function fetchCommitsBatch(
  auth: AdoCallerAuth,
  repositoryId: string,
  source: string,
  target: string,
  qualified: boolean,
): Promise<GitCommit[] | null> {
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/commitsbatch?$top=${COMMIT_TOP}&api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemVersion: toBranchVersion(source, qualified),
      compareVersion: toBranchVersion(target, qualified),
    }),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron cargar los commits."));
  }

  const payload = (await res.json()) as { value?: AdoGitCommit[] };
  return (payload.value ?? [])
    .map(mapCommit)
    .filter((commit): commit is GitCommit => Boolean(commit));
}

export async function listGitBranchNames(
  auth: AdoCallerAuth,
  repositoryId: string,
): Promise<string[]> {
  const query = new URLSearchParams({
    filter: "heads/",
    "api-version": API_VERSION,
  });
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/refs?${query}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron cargar las ramas."));
  }

  const payload = (await res.json()) as { value?: Array<{ name?: string }> };
  return (payload.value ?? [])
    .map((ref) => normalizeGitBranchName(ref.name ?? ""))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "es"));
}

export async function listCommitsBetweenBranches(
  auth: AdoCallerAuth,
  repositoryId: string,
  source: string,
  target: string,
): Promise<GitCommit[]> {
  const commits = await fetchCommitsBatch(auth, repositoryId, source, target, false);
  if (commits && commits.length > 0) return commits;

  return (await fetchCommitsBatch(auth, repositoryId, source, target, true)) ?? [];
}

export async function listFileChangesBetweenBranches(
  auth: AdoCallerAuth,
  repositoryId: string,
  source: string,
  target: string,
): Promise<BranchFileDiff> {
  const query = new URLSearchParams({
    baseVersion: target,
    baseVersionType: "branch",
    targetVersion: source,
    targetVersionType: "branch",
    diffCommonCommit: "true",
    $top: String(DIFF_TOP),
    "api-version": API_VERSION,
  });
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/diffs/commits?${query}`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron cargar los archivos."));
  }

  const payload = (await res.json()) as AdoGitDiffs;
  const seen = new Set<string>();
  const files: GitFileChange[] = [];

  for (const change of payload.changes ?? []) {
    const mapped = mapFileChange(change);
    if (!mapped || seen.has(mapped.path)) continue;
    seen.add(mapped.path);
    files.push(mapped);
  }

  return {
    files,
    commonCommit: payload.commonCommit ?? null,
    sourceCommit: payload.targetCommit ?? null,
  };
}

export async function getGitFileContent(
  auth: AdoCallerAuth,
  repositoryId: string,
  path: string,
  version: string,
  versionType: "branch" | "commit" = "branch",
): Promise<string | null> {
  const query = new URLSearchParams({
    path: normalizeGitPath(path),
    "versionDescriptor.version": version,
    "versionDescriptor.versionType": versionType,
    includeContent: "true",
    "api-version": API_VERSION,
  });
  const url = `${adoProjectBase(auth)}/_apis/git/repositories/${encodeURIComponent(repositoryId)}/items?${query}`;
  const res = await adoFetch(auth, url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const message = await readAdoError(res, "No se pudo leer el archivo.");
    if (message.includes("resolved to a Tree")) return null;
    throw new Error(message);
  }

  const body = await res.text();
  const item = parseAdoGitItem(body);
  if (!item) return body;
  if (item.isFolder || item.gitObjectType === "tree" || item.contentMetadata?.isBinary) {
    return null;
  }
  if (typeof item.content === "string") return item.content;

  const raw = await adoFetch(auth, url, {
    headers: { Accept: "text/plain" },
  });
  if (raw.status === 404 || !raw.ok) return null;
  return raw.text();
}
