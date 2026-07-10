CREATE TABLE IF NOT EXISTS "person_project_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "person_ado_id" text NOT NULL,
  "person_display_name" text NOT NULL,
  "project_id" text NOT NULL,
  "project_name" text NOT NULL,
  "role_id" uuid NOT NULL REFERENCES "roles"("id"),
  "assignment_pct" integer NOT NULL CHECK ("assignment_pct" >= 1 AND "assignment_pct" <= 100),
  "valid_from" date NOT NULL,
  "valid_to" date,
  "created_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "person_project_assignments_person_idx"
  ON "person_project_assignments" ("person_ado_id", "valid_from");

CREATE INDEX IF NOT EXISTS "person_project_assignments_project_idx"
  ON "person_project_assignments" ("project_id");

CREATE INDEX IF NOT EXISTS "person_project_assignments_valid_to_idx"
  ON "person_project_assignments" ("valid_to");

CREATE UNIQUE INDEX IF NOT EXISTS "person_project_assignments_unique_open"
  ON "person_project_assignments" ("person_ado_id", "project_id")
  WHERE "valid_to" IS NULL;
