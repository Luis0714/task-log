import "server-only";

import { getRepositories } from "@/lib/db";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import type { UserFilterScope } from "@/lib/db/ports/user-filter-preferences.repository.port";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type ResolvedFilterDefaults = {
  filters: WorkItemFilters;
  /** Scope del que provienen los filtros. "fallback" = última preferencia guardada del usuario. */
  source: UserFilterScope | "fallback" | "none";
};

/**
 * Resuelve los filtros predeterminados de un scope con fallback:
 * 1. Preferencias guardadas para este scope
 * 2. Última preferencia guardada del usuario en cualquier scope (cross-scope)
 * 3. Ninguna (la página debe aplicar defaults en código)
 */
export async function resolveFilterDefaults(
  scope: UserFilterScope,
): Promise<ResolvedFilterDefaults> {
  if (!isIronSessionConfigured()) {
    return { filters: defaultFilters(), source: "none" };
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { filters: defaultFilters(), source: "none" };
  }

  const repo = getRepositories().userFilterPreferences;

  try {
    const scoped = await repo.getByUserAndScope(userId, scope);
    if (scoped) return { filters: scoped, source: scope };
  } catch {
    // Continuar al fallback.
  }

  try {
    const recent = await repo.getMostRecent(userId);
    if (recent) return { filters: recent.filters, source: "fallback" };
  } catch {
    // Continuar al default.
  }

  return { filters: defaultFilters(), source: "none" };
}

function defaultFilters(): WorkItemFilters {
  return { search: "", assignee: "me", states: [] };
}
