import "server-only";

import { adoFetch, adoVsrmProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";

const API_VERSION = "7.1";
const LIST_TOP = 40;

export type AdoReleaseIdentity = {
  id?: string;
  displayName?: string;
};

export type AdoReleaseApproval = {
  id?: number;
  status?: string | number;
  approvalType?: string;
  isAutomated?: boolean;
  approver?: AdoReleaseIdentity;
  release?: { id?: number; name?: string };
  releaseEnvironment?: { id?: number; name?: string };
};

export type AdoReleaseEnvironment = {
  id?: number;
  name?: string;
  status?: string | number;
  rank?: number;
  preDeployApprovals?: AdoReleaseApproval[];
};

export type AdoReleaseArtifact = {
  definitionReference?: {
    branch?: { name?: string; id?: string };
    version?: { name?: string };
  };
};

export type AdoRelease = {
  id?: number;
  name?: string;
  createdOn?: string;
  createdBy?: AdoReleaseIdentity;
  releaseDefinition?: { id?: number; name?: string };
  environments?: AdoReleaseEnvironment[];
  artifacts?: AdoReleaseArtifact[];
};

export type AdoReleaseDefinition = {
  id?: number;
  name?: string;
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

function vsrm(auth: AdoCallerAuth): string {
  return adoVsrmProjectBase(auth);
}

export async function listAdoReleaseDefinitions(
  auth: AdoCallerAuth,
): Promise<AdoReleaseDefinition[]> {
  const query = new URLSearchParams({
    $top: "100",
    "api-version": API_VERSION,
  });
  const res = await adoFetch(auth, `${vsrm(auth)}/_apis/release/definitions?${query}`);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron listar las definiciones de release."));
  }
  const payload = (await res.json()) as { value?: AdoReleaseDefinition[] };
  return payload.value ?? [];
}

export async function listAdoReleases(
  auth: AdoCallerAuth,
  definitionId: number,
): Promise<AdoRelease[]> {
  const query = new URLSearchParams({
    definitionId: String(definitionId),
    $top: String(LIST_TOP),
    $expand: "environments",
    queryOrder: "descending",
    "api-version": API_VERSION,
  });
  const res = await adoFetch(auth, `${vsrm(auth)}/_apis/release/releases?${query}`);
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudieron listar los releases."));
  }
  const payload = (await res.json()) as { value?: AdoRelease[] };
  return payload.value ?? [];
}

export async function listAdoPendingReleaseApprovals(
  auth: AdoCallerAuth,
): Promise<AdoReleaseApproval[]> {
  const query = new URLSearchParams({
    statusFilter: "pending",
    $top: "100",
    "api-version": API_VERSION,
  });
  const res = await adoFetch(auth, `${vsrm(auth)}/_apis/release/approvals?${query}`);
  if (!res.ok) return [];
  const payload = (await res.json()) as { value?: AdoReleaseApproval[] };
  return payload.value ?? [];
}

export async function approveAdoReleaseApproval(
  auth: AdoCallerAuth,
  approvalId: number,
  comments: string,
): Promise<void> {
  const url = `${vsrm(auth)}/_apis/release/approvals/${approvalId}?api-version=${API_VERSION}`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "approved",
      comments,
    }),
  });
  if (!res.ok) {
    throw new Error(await readAdoError(res, "No se pudo aprobar el despliegue."));
  }
}
