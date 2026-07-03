CREATE TABLE IF NOT EXISTS "time_log_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "default_title" text NOT NULL,
  "default_description" text NOT NULL,
  "is_system" boolean NOT NULL DEFAULT false,
  "seed_key" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "time_log_templates_user_name_unique"
  ON "time_log_templates" ("user_id", "name");

CREATE INDEX IF NOT EXISTS "time_log_templates_user_idx"
  ON "time_log_templates" ("user_id");
