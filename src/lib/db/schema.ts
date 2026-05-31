import {
  integer,
  pgEnum,
  pgTable,
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

/** Cómo la app llama a Azure DevOps para este usuario. */
export const adoAuthMethodEnum = pgEnum("ado_auth_method", ["pat", "oauth"]);

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

/** Objetivo por HU dentro de un sprint (estado/TAC/observación esperados). */
export const sprintStoryGoals = pgTable(
  "sprint_story_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization: text("organization").notNull(),
    project: text("project").notNull(),
    team: text("team").notNull(),
    sprintPath: text("sprint_path").notNull(),
    workItemId: integer("work_item_id").notNull(),
    targetStateName: text("target_state_name"),
    targetTacTagName: text("target_tac_tag_name"),
    baselineStateName: text("baseline_state_name"),
    baselineTacTagName: text("baseline_tac_tag_name"),
    observation: text("observation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sprint_story_goals_scope_work_item_unique").on(
      table.organization,
      table.project,
      table.team,
      table.sprintPath,
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
