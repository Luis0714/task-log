import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  UserFilterPreferencesRepository,
  UserFilterPreferencesRow,
  UserFilterScope,
} from "@/lib/db/ports/user-filter-preferences.repository.port";
import { userFilterPreferences } from "@/lib/db/schema";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export const drizzleUserFilterPreferencesRepository: UserFilterPreferencesRepository =
  {
    async getByUserAndScope(
      userId: string,
      scope: UserFilterScope,
    ): Promise<WorkItemFilters | null> {
      const rows = await getDb()
        .select({ filters: userFilterPreferences.filters })
        .from(userFilterPreferences)
        .where(
          and(
            eq(userFilterPreferences.userId, userId),
            eq(userFilterPreferences.scope, scope),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) return null;
      return row.filters as WorkItemFilters;
    },

    async getMostRecent(userId: string): Promise<UserFilterPreferencesRow | null> {
      const rows = await getDb()
        .select({
          scope: userFilterPreferences.scope,
          filters: userFilterPreferences.filters,
          updatedAt: userFilterPreferences.updatedAt,
        })
        .from(userFilterPreferences)
        .where(eq(userFilterPreferences.userId, userId))
        .orderBy(desc(userFilterPreferences.updatedAt))
        .limit(1);

      const row = rows[0];
      if (!row) return null;
      return {
        scope: row.scope as UserFilterScope,
        filters: row.filters as WorkItemFilters,
        updatedAt: row.updatedAt,
      };
    },

    async upsert(
      userId: string,
      scope: UserFilterScope,
      filters: WorkItemFilters,
    ): Promise<void> {
      const result = await getDb()
        .insert(userFilterPreferences)
        .values({ userId, scope, filters })
        .onConflictDoUpdate({
          target: [userFilterPreferences.userId, userFilterPreferences.scope],
          set: { filters, updatedAt: new Date() },
        })
        .returning({ id: userFilterPreferences.id });
      console.log("[user-filter-prefs.repo] upsert result", result);
    },
  };
