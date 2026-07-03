CREATE TABLE IF NOT EXISTS "user_filter_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "scope" text NOT NULL,
  "filters" jsonb NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_filter_preferences_user_scope_unique"
  ON "user_filter_preferences" ("user_id", "scope");
