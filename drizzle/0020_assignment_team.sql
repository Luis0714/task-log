ALTER TABLE "person_project_assignments"
  ADD COLUMN IF NOT EXISTS "team_id" text,
  ADD COLUMN IF NOT EXISTS "team_name" text;

DROP INDEX IF EXISTS "person_project_assignments_unique_open";

CREATE UNIQUE INDEX IF NOT EXISTS "person_project_assignments_unique_open"
  ON "person_project_assignments" ("person_ado_id", "project_id", COALESCE("team_id", ''))
  WHERE "valid_to" IS NULL;
