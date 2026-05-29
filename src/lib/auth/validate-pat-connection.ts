import "server-only";

import { adoAuthHeader } from "@/lib/azure-devops/client";

export type PatConnectionInput = {
  organization: string;
  project: string;
  pat: string;
};

export type PatValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function validatePatConnection(
  input: PatConnectionInput,
): Promise<PatValidationResult> {
  const organization = input.organization.trim();
  const project = input.project.trim();
  const pat = input.pat.trim();

  if (!organization || !project || !pat) {
    return { ok: false, message: "Completa organización, proyecto y código de acceso." };
  }

  const authHeader = adoAuthHeader({ mode: "pat", organization, project, pat });

  try {
    const projectUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/_apis/projects/${encodeURIComponent(project)}?api-version=7.1`;
    const projectRes = await fetch(projectUrl, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    if (projectRes.status === 401 || projectRes.status === 403) {
      return {
        ok: false,
        message: "El código de acceso no es válido o no tiene permisos suficientes.",
      };
    }

    if (!projectRes.ok) {
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
