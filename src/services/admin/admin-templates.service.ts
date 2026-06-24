import type {
  AdminCreateTimeLogTemplateBody,
  AdminUpdateTimeLogTemplateBody,
  TimeLogTemplateDto,
} from "@/lib/schemas/time-log-template";

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Error ${response.status}.`;
  } catch {
    return `Error ${response.status}.`;
  }
}

export async function listAdminTemplates(): Promise<TimeLogTemplateDto[]> {
  const res = await fetch("/api/admin/templates", {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const body = (await res.json()) as { templates: TimeLogTemplateDto[] };
  return body.templates;
}

export async function createAdminTemplate(
  input: AdminCreateTimeLogTemplateBody,
): Promise<TimeLogTemplateDto> {
  const res = await fetch("/api/admin/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const body = (await res.json()) as { template: TimeLogTemplateDto };
  return body.template;
}

export async function updateAdminTemplate(
  id: string,
  input: AdminUpdateTimeLogTemplateBody,
): Promise<TimeLogTemplateDto> {
  const res = await fetch(`/api/admin/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const body = (await res.json()) as { template: TimeLogTemplateDto };
  return body.template;
}

export async function deleteAdminTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/admin/templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}
