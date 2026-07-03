import type {
  UserFilterScope,
} from "@/lib/db/ports/user-filter-preferences.repository.port";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export async function fetchFilterPreferences(
  scope: UserFilterScope,
): Promise<WorkItemFilters | null> {
  const res = await fetch(`/api/user/filter-preferences?scope=${scope}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudieron cargar los filtros guardados.");
  }
  const data = (await res.json()) as { filters: WorkItemFilters | null };
  return data.filters ?? null;
}

export async function saveFilterPreferences(
  scope: UserFilterScope,
  filters: WorkItemFilters,
): Promise<void> {
  const url = "/api/user/filter-preferences";
  const body = JSON.stringify({ scope, filters });
  console.log("[filter-prefs.service] PUT", url, body);
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  console.log("[filter-prefs.service] response", res.status, res.statusText);
  if (!res.ok) {
    let message = `HTTP ${res.status} al guardar los filtros predeterminados.`;
    try {
      const payload = (await res.json()) as { error?: string };
      console.log("[filter-prefs.service] error body", payload);
      if (payload.error) message = payload.error;
    } catch {
      // ignore JSON parse errors and keep the status-based message
    }
    throw new Error(message);
  }
}
