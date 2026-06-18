import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import type { UserFilterScope } from "@/lib/filters/user-filter-scopes";

export type { UserFilterScope } from "@/lib/filters/user-filter-scopes";

export type UserFilterPreferencesRow = {
  scope: UserFilterScope;
  filters: WorkItemFilters;
  updatedAt: Date;
};

export interface UserFilterPreferencesRepository {
  getByUserAndScope(
    userId: string,
    scope: UserFilterScope,
  ): Promise<WorkItemFilters | null>;
  /** Devuelve las preferencias más recientes del usuario en cualquier scope, o null. */
  getMostRecent(userId: string): Promise<UserFilterPreferencesRow | null>;
  upsert(
    userId: string,
    scope: UserFilterScope,
    filters: WorkItemFilters,
  ): Promise<void>;
}
