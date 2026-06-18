import {
  boolean as pgBoolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Cómo el usuario entra a TaskPilot (no cómo se conecta a ADO). */
export const userAuthProviderEnum = pgEnum("user_auth_provider", [
  "local",
  "entra",
]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;

/** Cómo la app llama a Azure DevOps para este usuario. */
export const adoAuthMethodEnum = pgEnum("ado_auth_method", ["pat", "oauth"]);

/** Tipo de feature de IA que produjo la interacción (auditoría). */
export const llmInteractionFeatureEnum = pgEnum("llm_interaction_feature", [
  "log-work",
  "create-tasks",
  "weekly-summary",
  "chat",
]);

/** Origen del cierre de retrospectiva del sprint. */
export const sprintSnapshotSourceEnum = pgEnum("sprint_snapshot_source", [
  "manual",
  "auto",
]);

/** Resultado de cumplimiento por HU al finalizar el sprint. */
export const sprintStoryGoalStatusEnum = pgEnum("sprint_story_goal_status", [
  "achieved",
  "partial",
  "missed",
  "excluded",
  "no_target",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Correo de inicio de sesión; solo usuarios `local` (registro PAT). */
    username: text("username"),
    /** bcrypt; solo `local`. */
    passwordHash: text("password_hash"),
    authProvider: userAuthProviderEnum("auth_provider").notNull(),
    /** ID estable de Entra / perfil ADO (`adoProfile.id`). Solo `entra`. */
    entraSubject: text("entra_subject"),
    email: text("email"),
    displayName: text("display_name"),
    roleId: uuid("role_id").references(() => roles.id),
    isActive: pgBoolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_entra_subject_unique").on(table.entraSubject),
  ],
);

export const adoConnections = pgTable(
  "ado_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authMethod: adoAuthMethodEnum("auth_method").notNull(),
    organization: text("organization").notNull(),
    project: text("project").notNull(),
    team: text("team"),
    /**
     * JSON cifrado (AES-256-GCM): `{ pat }` o `{ refreshToken }`.
     * Ver `encryptAdoSecrets` / `decryptAdoSecrets`.
     */
    encryptedSecrets: text("encrypted_secrets").notNull(),
    adoProfileId: text("ado_profile_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("ado_connections_user_id_unique").on(table.userId)],
);

/** Objetivo general del sprint (texto libre opcional por alcance). */
export const sprintGoals = pgTable(
  "sprint_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization: text("organization").notNull(),
    project: text("project").notNull(),
    team: text("team").notNull(),
    sprintPath: text("sprint_path").notNull(),
    generalObjective: text("general_objective"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sprint_goals_scope_unique").on(
      table.organization,
      table.project,
      table.team,
      table.sprintPath,
    ),
  ],
);

/** Objetivo por HU dentro de un sprint (estado/TAC/observación esperados). */
export const sprintStoryGoals = pgTable(
  "sprint_story_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sprintGoalId: uuid("sprint_goal_id")
      .notNull()
      .references(() => sprintGoals.id, { onDelete: "cascade" }),
    workItemId: integer("work_item_id").notNull(),
    targetStateName: text("target_state_name"),
    targetTacTagName: text("target_tac_tag_name"),
    baselineStateName: text("baseline_state_name"),
    baselineTacTagName: text("baseline_tac_tag_name"),
    includedInGoal: pgBoolean("included_in_goal").notNull().default(true),
    observation: text("observation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sprint_story_goals_sprint_goal_work_item_unique").on(
      table.sprintGoalId,
      table.workItemId,
    ),
  ],
);

/**
 * Retrospectiva congelada de un sprint (una fila por versión de cierre).
 * Permite consultar dashboard/objetivo histórico sin depender del ADO actual.
 */
export const sprintSnapshots = pgTable(
  "sprint_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sprintGoalId: uuid("sprint_goal_id")
      .notNull()
      .references(() => sprintGoals.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }).notNull(),
    finalizedByUserId: uuid("finalized_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    finalizedByDisplayName: text("finalized_by_display_name"),
    source: sprintSnapshotSourceEnum("source").notNull(),
    generalObjective: text("general_objective"),
    sprintName: text("sprint_name"),
    sprintStartDate: text("sprint_start_date"),
    sprintFinishDate: text("sprint_finish_date"),
    goalsTotalCount: integer("goals_total_count").notNull().default(0),
    goalsAchievedCount: integer("goals_achieved_count").notNull().default(0),
    goalsPartialCount: integer("goals_partial_count").notNull().default(0),
    goalsMissedCount: integer("goals_missed_count").notNull().default(0),
    goalsExcludedCount: integer("goals_excluded_count").notNull().default(0),
    goalsNoTargetCount: integer("goals_no_target_count").notNull().default(0),
    storyPointsInGoal: real("story_points_in_goal").notNull().default(0),
    storyPointsAchieved: real("story_points_achieved").notNull().default(0),
    statsPayload: jsonb("stats_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sprint_snapshots_sprint_goal_version_unique").on(
      table.sprintGoalId,
      table.version,
    ),
  ],
);

/** Estado congelado de cada HU incluida en la retrospectiva del sprint. */
export const sprintStorySnapshots = pgTable(
  "sprint_story_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sprintSnapshotId: uuid("sprint_snapshot_id")
      .notNull()
      .references(() => sprintSnapshots.id, { onDelete: "cascade" }),
    workItemId: integer("work_item_id").notNull(),
    title: text("title").notNull(),
    assignedTo: text("assigned_to"),
    effort: real("effort"),
    includedInGoal: pgBoolean("included_in_goal").notNull().default(true),
    baselineStateName: text("baseline_state_name"),
    baselineTacTagName: text("baseline_tac_tag_name"),
    targetStateName: text("target_state_name"),
    targetTacTagName: text("target_tac_tag_name"),
    finalStateName: text("final_state_name"),
    finalTacTagName: text("final_tac_tag_name"),
    goalStatus: sprintStoryGoalStatusEnum("goal_status").notNull(),
    observation: text("observation"),
  },
  (table) => [
    uniqueIndex("sprint_story_snapshots_snapshot_work_item_unique").on(
      table.sprintSnapshotId,
      table.workItemId,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AdoConnection = typeof adoConnections.$inferSelect;
export type NewAdoConnection = typeof adoConnections.$inferInsert;
export type SprintStoryGoal = typeof sprintStoryGoals.$inferSelect;
export type NewSprintStoryGoal = typeof sprintStoryGoals.$inferInsert;
export type SprintGoal = typeof sprintGoals.$inferSelect;
export type NewSprintGoal = typeof sprintGoals.$inferInsert;
export type SprintSnapshot = typeof sprintSnapshots.$inferSelect;
export type NewSprintSnapshot = typeof sprintSnapshots.$inferInsert;
export type SprintStorySnapshot = typeof sprintStorySnapshots.$inferSelect;
export type NewSprintStorySnapshot = typeof sprintStorySnapshots.$inferInsert;

/** Auditoría cruda de cada llamada al LLM (fire-and-forget desde el orquestador). */
export const llmInteractions = pgTable(
  "llm_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: llmInteractionFeatureEnum("feature").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    latencyMs: integer("latency_ms").notNull(),
    requestHash: text("request_hash").notNull(),
    responseJson: jsonb("response_json").notNull(),
    ok: pgBoolean("ok").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("llm_interactions_user_created_idx").on(table.userId, table.createdAt),
    index("llm_interactions_feature_created_idx").on(
      table.feature,
      table.createdAt,
    ),
  ],
);

export type LlmInteraction = typeof llmInteractions.$inferSelect;
export type NewLlmInteraction = typeof llmInteractions.$inferInsert;

/** Filtros predeterminados por usuario y scope (work-items, time-log, ...). */
export const userFilterPreferences = pgTable(
  "user_filter_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Identificador del feature: "work-items" | "time-log" | futuro. */
    scope: text("scope").notNull(),
    /** WorkItemFilters validado por workItemFiltersSchema (jsonb). */
    filters: jsonb("filters").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_filter_preferences_user_scope_unique").on(
      table.userId,
      table.scope,
    ),
  ],
);

export type UserFilterPreferences = typeof userFilterPreferences.$inferSelect;
export type NewUserFilterPreferences = typeof userFilterPreferences.$inferInsert;
