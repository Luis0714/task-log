import "server-only";

import { adoFetch, adoOrgBase } from "@/lib/azure-devops/client";

export type PatConnectionInput = {
  organization: string;
  project: string;
  pat: string;
};

export type PatValidationResult =
  | { ok: true }
  | { ok: false; message: string };

type ProjectsResponse = {
  value?: Array<{ name?: string }>;
};

export async function validatePatConnection(
  input: PatConnectionInput,
): Promise<PatValidationResult> {
  const organization = input.organization.trim();
  const project = input.project.trim();
  const pat = input.pat.trim();

  if (!organization || !project || !pat) {
    return { ok: false, message: "Completa organización, proyecto y código de acceso." };
  }

  const caller = { mode: "pat" as const, organization, project, pat };

  try {
    const url = `${adoOrgBase(caller)}/_apis/projects?api-version=7.1&$top=100&stateFilter=WellFormed`;
    const res = await adoFetch(caller, url);

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "El código de acceso no es válido o no tiene permisos suficientes.",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        message: "No pudimos comprobar la conexión. Inténtalo de nuevo en unos segundos.",
      };
    }

    const data = (await res.json()) as ProjectsResponse;
    const match = (data.value ?? []).some((item) => item.name === project);

    if (!match) {
      return {
        ok: false,
        message: "No encontramos ese proyecto en la organización. Revisa los nombres.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "No pudimos comprobar la conexión. Inténtalo de nuevo en unos segundos.",
    };
  }
}
