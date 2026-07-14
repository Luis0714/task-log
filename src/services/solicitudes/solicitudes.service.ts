import "client-only";

import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";
import type { SolicitudOptions } from "@/lib/novedades/solicitud-options";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";

export type CreateSolicitudResponse = { workItemId: number; url: string };

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Error ${res.status}.`;
  } catch {
    return `Error ${res.status}.`;
  }
}

export async function fetchMySolicitudes(): Promise<SolicitudDto[]> {
  const res = await fetch("/api/solicitudes", { cache: "no-store" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const body = (await res.json()) as { solicitudes: SolicitudDto[] };
  return body.solicitudes;
}

export async function fetchSolicitudOptions(
  project: string,
): Promise<SolicitudOptions> {
  const res = await fetch(
    `/api/solicitudes/options?project=${encodeURIComponent(project)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as SolicitudOptions;
}

export async function createSolicitud(
  body: CreateSolicitudBody,
): Promise<CreateSolicitudResponse> {
  const res = await fetch("/api/solicitudes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as CreateSolicitudResponse;
}

export type UpdateSolicitudResponse = { workItemId: number; url: string };

export async function updateSolicitud(
  workItemId: number,
  body: CreateSolicitudBody,
): Promise<UpdateSolicitudResponse> {
  const res = await fetch(`/api/solicitudes/${workItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as UpdateSolicitudResponse;
}

export type DeleteSolicitudResponse = { ok: true };

export async function deleteSolicitud(
  workItemId: number,
  project: string,
): Promise<DeleteSolicitudResponse> {
  const res = await fetch(`/api/solicitudes/${workItemId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as DeleteSolicitudResponse;
}
