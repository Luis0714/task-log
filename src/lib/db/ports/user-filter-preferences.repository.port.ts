import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type UserFilterScope = "work-items" | "time-log";

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
