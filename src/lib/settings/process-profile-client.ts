import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { TaskDateFieldOption } from "@/lib/settings/task-date-field-options";

export type ProcessProfileResponse = {
  profile: AdoProcessProfile;
  taskDateFieldOptions?: TaskDateFieldOption[];
};

async function requestProcessProfile(
  method: "PATCH" | "POST",
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<ProcessProfileResponse> {
  const res = await fetch("/api/settings/process-profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ProcessProfileResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? fallbackError);
  }
  return data;
}

export function saveProcessProfile(
  body: Record<string, unknown>,
): Promise<ProcessProfileResponse> {
  return requestProcessProfile("PATCH", body, "No se pudo guardar.");
}

export function rediscoverProcessProfile(
  project: string,
): Promise<ProcessProfileResponse> {
  return requestProcessProfile("POST", { project }, "No se pudo actualizar.");
}
