import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { isPatConfigured } from "@/lib/azure-devops/resolve-auth";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";

function authHeader(auth: AdoCallerAuth): string {
  if (auth.mode === "pat") {
    const token = Buffer.from(`:${auth.pat}`).toString("base64");
    return `Basic ${token}`;
  }
  return `Bearer ${auth.accessToken}`;
}

const COMPLETED_WORK = "Microsoft.VSTS.Scheduling.CompletedWork";

export async function logWorkOnWorkItem(
  params: { workItemId: number; hours: number; comment: string },
  auth: AdoCallerAuth,
): Promise<{ ok: true; newCompletedWork: number } | { ok: false; status: number; body: string }> {
  const base = `https://dev.azure.com/${encodeURIComponent(auth.organization)}/${encodeURIComponent(auth.project)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json",
  };

  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(COMPLETED_WORK)}`;
  const getRes = await fetch(getUrl, { headers, cache: "no-store" });
  if (getRes.status === 401 || getRes.status === 403) {
    const body = await getRes.text();
    return {
      ok: false,
      status: getRes.status,
      body:
        getRes.status === 403
          ? "Permisos insuficientes en este proyecto (se requiere acceso de escritura a work items)."
          : body.slice(0, 500),
    };
  }
  if (!getRes.ok) {
    const body = await getRes.text();
    return { ok: false, status: getRes.status, body: body.slice(0, 500) };
  }

  const wi = (await getRes.json()) as { fields?: Record<string, number | string | undefined> };
  const currentRaw = wi.fields?.[COMPLETED_WORK];
  const current =
    typeof currentRaw === "number"
      ? currentRaw
      : typeof currentRaw === "string"
        ? Number.parseFloat(currentRaw)
        : 0;
  const previous = Number.isFinite(current) ? current : 0;
  const newCompletedWork = Math.round((previous + params.hours) * 100) / 100;

  const hadField =
    wi.fields?.[COMPLETED_WORK] !== undefined && wi.fields?.[COMPLETED_WORK] !== null;
  const patchOp = hadField ? "replace" : "add";

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchBody = JSON.stringify([
    { op: patchOp, path: `/fields/${COMPLETED_WORK}`, value: newCompletedWork },
  ]);

  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json-patch+json",
    },
    body: patchBody,
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    return { ok: false, status: patchRes.status, body: body.slice(0, 500) };
  }

  const commentText = params.comment.trim();
  if (commentText) {
    const commentsUrl = `${base}/${params.workItemId}/comments?${api}-preview.3`;
    await fetch(commentsUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `[TaskPilot] +${params.hours}h — ${commentText}`,
      }),
    }).catch(() => undefined);
  }

  return { ok: true, newCompletedWork };
}

/** True si el método de auth activo está listo para ejecutar en Azure DevOps. */
export async function isAdoExecutionReady(): Promise<boolean> {
  if (isPatAuthMethod()) return isPatConfigured();

  if (!isOAuthAuthMethod() || !isIronSessionConfigured()) return false;

  const session = await getTaskPilotSession();
  return Boolean(
    session.azdoRefreshToken && session.defaultOrg?.trim() && session.defaultProject?.trim(),
  );
}
