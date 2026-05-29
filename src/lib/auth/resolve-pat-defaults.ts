import "server-only";

import { listOrganizationProjects } from "@/lib/azure-devops/projects";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type PatDefaultsResult =
  | { ok: true; organization: string; project: string }
  | { ok: false; message: string };

type ProfilePayload = {
  id?: string;
  displayName?: string;
};

type AccountsPayload = {
  value?: Array<{ accountName?: string }>;
};

function patAuthorizationHeader(pat: string): string {
  const token = Buffer.from(`:${pat.trim()}`).toString("base64");
  return `Basic ${token}`;
}

async function fetchPatProfile(pat: string): Promise<{ id: string } | null> {
  const res = await fetch(
    "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1",
    {
      headers: { Authorization: patAuthorizationHeader(pat) },
      cache: "no-store",
    },
  );

  if (!res.ok) return null;

  const profile = (await res.json()) as ProfilePayload;
  return profile.id ? { id: profile.id } : null;
}

async function listPatAccounts(pat: string, memberId: string): Promise<string[]> {
  const url = new URL("https://app.vssps.visualstudio.com/_apis/accounts");
  url.searchParams.set("memberId", memberId);
  url.searchParams.set("api-version", "7.1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: patAuthorizationHeader(pat) },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as AccountsPayload;
  return (data.value ?? [])
    .map((account) => account.accountName?.trim())
    .filter((name): name is string => Boolean(name));
}

/** Primera organización y primer proyecto accesibles con el PAT. */
export async function resolvePatDefaults(pat: string): Promise<PatDefaultsResult> {
  const trimmedPat = pat.trim();
  if (!trimmedPat) {
    return { ok: false, message: "Pega tu código de acceso." };
  }

  const profile = await fetchPatProfile(trimmedPat);
  if (!profile) {
    return {
      ok: false,
      message: "El código de acceso no es válido o no tiene permisos suficientes.",
    };
  }

  const organizations = await listPatAccounts(trimmedPat, profile.id);
  const organization = organizations[0];
  if (!organization) {
    return {
      ok: false,
      message: "No encontramos ninguna organización asociada a este código.",
    };
  }

  const caller: AdoCallerAuth = {
    mode: "pat",
    organization,
    project: organization,
    pat: trimmedPat,
  };

  let projects;
  try {
    projects = await listOrganizationProjects(caller);
  } catch {
    return {
      ok: false,
      message: "No pudimos listar los proyectos de tu organización.",
    };
  }

  const project = projects[0]?.name;
  if (!project) {
    return {
      ok: false,
      message: "No encontramos proyectos en la organización. Crea uno en Azure DevOps.",
    };
  }

  return { ok: true, organization, project };
}
